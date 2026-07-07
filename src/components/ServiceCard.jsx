//service card

const ServiceCard = ({ service }) => {
  const getPriceLabel = () => {
    const pricing = service?.pricing;

    if (!pricing) {
      return "Price available on request";
    }

    if (pricing.type === "fixed") {
      return `From GH₵ ${pricing.price}`;
    }

    if (pricing.type === "options") {
      const minPrice = Math.min(
        ...pricing.options.map((option) => option.price),
      );
      return `From GH₵ ${minPrice}`;
    }

    if (pricing.type === "list") {
      const minPrice = Math.min(...pricing.items.map((item) => item.price));
      return `From GH₵ ${minPrice}`;
    }

    return "Price varies by service details";
  };

  return (
    <div className="service-card">
      <div className="service-card-image">
        <img src={service.image} alt={service.name} />
      </div>
      <div className="service-card-content">
        <h4>{service.name}</h4>
        <p>
          {service.description ||
            "Tailored salon service available on request."}
        </p>
        <span className="service-card-price">{getPriceLabel()}</span>
      </div>
    </div>
  );
};

export default ServiceCard;
