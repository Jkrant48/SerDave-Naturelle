import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import haircareImage from "../assets/haircare.jpg";
import salonData from "../json/salon.json";

const ServicesPage = () => {
  const servicesData = salonData.services || {};
  const currencySymbol = salonData.salon?.currency?.symbol || "GH₵";

  const formatPrice = (service) => {
    if (service.pricingType === "matrix") {
      const prices = service.prices || [];
      const flatPrices = prices.flatMap((row) =>
        Object.entries(row)
          .filter(([key]) => key !== "length")
          .map(([, value]) => Number(value)),
      );
      const minPrice = flatPrices.length ? Math.min(...flatPrices) : 0;
      return `From ${currencySymbol} ${minPrice}`;
    }

    if (service.pricingType === "perInch") {
      if (service.options?.length) {
        const minPrice = Math.min(
          ...service.options.map((option) => Number(option.price || 0)),
        );
        return `From ${currencySymbol} ${minPrice} per inch`;
      }

      const price = service.startingPrice || service.price || 0;
      return `From ${currencySymbol} ${price} per inch`;
    }

    if (service.pricingType === "fixed") {
      return `${currencySymbol} ${service.price}`;
    }

    if (service.pricingType === "list") {
      const allPrices = (service.details || []).map((item) => item.price);
      const minPrice = allPrices.length ? Math.min(...allPrices) : 0;
      return `From ${currencySymbol} ${minPrice}`;
    }

    return "Price available on request";
  };

  const retighteningEntries = [];
  const retighteningData = servicesData.locs?.retightening || {};

  ["smallLocs", "mediumLocs", "largeLocs"].forEach((key) => {
    const items = retighteningData[key] || [];

    if (!items.length) return;

    retighteningEntries.push({
      id: `${key}`,
      name:
        key === "smallLocs"
          ? "Small Locs Retightening"
          : key === "mediumLocs"
            ? "Medium Locs Retightening"
            : "Large Locs Retightening",
      pricingType: "list",
      details: items.map((item) => ({
        label: item.length,
        price: item.startingPrice,
      })),
    });
  });

  const serviceSections = [
    {
      id: "braids",
      title: "Braids",
      items: servicesData.braids || [],
    },
    {
      id: "starter_locs",
      title: "Starter Locs",
      items: servicesData.locs?.starterLocs || [],
    },
    {
      id: "locs_retightening",
      title: "Locs Retightening",
      items: retighteningEntries,
    },
    {
      id: "additional_services",
      title: "Additional Services",
      items: servicesData.addOns || [],
    },
    {
      id: "treatments",
      title: "Hair Treatments",
      items: servicesData.treatments || [],
    },
  ];

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
            {serviceSections.map((section) => (
              <div key={section.id} className="service-table-section">
                <h3>{section.title}</h3>
                {section.items.length ? (
                  <div className="service-table-wrapper">
                    <table className="service-pricing-table">
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.items.map((service) => (
                          <tr key={service.id}>
                            <td>{service.name}</td>
                            <td>
                              {service.pricingType === "list" &&
                              service.details?.length
                                ? service.details
                                    .map(
                                      (detail) =>
                                        `${detail.label}: ${currencySymbol} ${detail.price}`,
                                    )
                                    .join(" • ")
                                : formatPrice(service)}
                            </td>
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
