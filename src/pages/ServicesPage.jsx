import Header from "../components/Header";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import haircareImage from "../assets/haircare.jpg";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const formatServicePrice = (service) => {
  const amount = new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(Number(service.price));
  const variablePrice = /varies|starts from|per inch/i.test(
    service.description || "",
  );

  return variablePrice ? `From ${amount}` : amount;
};

const ServicesPage = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE_URL}/api/services`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Could not load services.");
        }
        return result.categories;
      })
      .then((result) => {
        setCategories(result);
        setIsLoading(false);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setErrorMessage(error.message || "Could not load services.");
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="s-page-hero">
          <div className="hero-banner">
            <div className="hero-banner-inner">
              <h3>Welcome to our digital space!</h3>
              <p>
                Discover the perfect blend of traditional techniques and modern
                innovation.
              </p>
            </div>
          </div>
          <div className="hero-content">
            <div className="hero-content-text">
              <h1>Our Services</h1>
              <Link to="/Booking" className="book-btn">
                Book an Appointment
              </Link>
            </div>
            <img
              src={haircareImage}
              alt="Haircare"
              className="hero-content-image"
            />
          </div>
        </section>
        <section className="page-card">
          <div className="service-table-layout">
            {isLoading && <p role="status">Loading services...</p>}
            {errorMessage && <p role="alert">{errorMessage}</p>}
            {!isLoading &&
              !errorMessage &&
              categories.map((category) => (
                <div key={category.id} className="service-table-section">
                  <h3>{category.name}</h3>
                  {category.services.length ? (
                    <div className="service-table-wrapper">
                      <table className="service-pricing-table">
                        <thead>
                          <tr>
                            <th>Service</th>
                            <th>Details</th>
                            <th>Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.services.map((service) => (
                            <tr key={service.id}>
                              <td>{service.serviceName}</td>
                              <td>
                                <p>{service.description}</p>
                                {service.durationMinutes && (
                                  <p>{service.durationMinutes} minutes</p>
                                )}
                                {Number(service.depositAmount) > 0 && (
                                  <p>
                                    Deposit:{" "}
                                    {formatServicePrice({
                                      ...service,
                                      price: service.depositAmount,
                                      description: "",
                                    })}
                                  </p>
                                )}
                              </td>
                              <td>{formatServicePrice(service)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="empty-service-state">
                      More services coming soon.
                    </p>
                  )}
                </div>
              ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ServicesPage;
