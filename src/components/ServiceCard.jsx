//service card

const ServiceCard = ({ service, currencySymbol = "GH₵" }) => {
  const getPriceLabel = () => {
    if (service.pricingType === "fixed") {
      return `From ${currencySymbol} ${service.price}`;
    }

    if (service.pricingType === "perInch") {
      const startingPrice = service.startingPrice || service.price;
      if (startingPrice) {
        return `From ${currencySymbol} ${startingPrice} per inch`;
      }

      const minPrice = Math.min(
        ...(service.options || []).map((option) => option.price),
      );
      return `From ${currencySymbol} ${minPrice} per inch`;
    }

    if (service.pricingType === "matrix") {
      const firstRow = service.prices?.[0];
      if (firstRow) {
        const values = Object.entries(firstRow).filter(
          ([key]) => key !== "length",
        );
        const minPrice = Math.min(...values.map(([, value]) => Number(value)));
        return `From ${currencySymbol} ${minPrice} by length and size`;
      }
    }

    if (service.pricingType === "list") {
      const minPrice = Math.min(
        ...(service.details || []).map((item) => item.price),
      );
      return `From ${currencySymbol} ${minPrice}`;
    }

    if (service.startingPrice) {
      return `From ${currencySymbol} ${service.startingPrice}`;
    }

    return "Price available on request";
  };

  const getDescription = () => {
    if (service.description) return service.description;

    if (service.pricingType === "matrix") {
      return "Custom styling priced by length and braid size.";
    }

    if (service.pricingType === "perInch") {
      return "Pricing is tailored to your hair needs and measured per inch.";
    }

    if (service.pricingType === "fixed") {
      return "A straightforward service with a set appointment price.";
    }

    return "Tailored salon service available on request.";
  };

  const getDetails = () => {
    const detailItems = [];

    if (service.duration?.min && service.duration?.max) {
      detailItems.push(
        `Approx. ${service.duration.min}-${service.duration.max} mins`,
      );
    }

    if (service.method) {
      detailItems.push(`Method: ${service.method}`);
    }

    if (service.sizes?.length) {
      detailItems.push(`Available sizes: ${service.sizes.join(", ")}`);
    }

    if (service.bookingFields?.length) {
      detailItems.push(`Booking details: ${service.bookingFields.join(", ")}`);
    }

    if (service.options?.length) {
      detailItems.push(
        `Options: ${service.options
          .map((option) => `${option.name} (${currencySymbol}${option.price})`)
          .join(" • ")}`,
      );
    }

    if (service.details?.length) {
      detailItems.push(
        ...service.details.map((detail) =>
          typeof detail === "string"
            ? detail
            : `${detail.label}: ${currencySymbol}${detail.price}`,
        ),
      );
    }

    if (service.prices?.length) {
      const sampleRows = service.prices.slice(0, 2).map((row) => {
        const values = Object.entries(row).filter(([key]) => key !== "length");
        const minPrice = Math.min(...values.map(([, value]) => Number(value)));
        return `${row.length}: ${currencySymbol}${minPrice}`;
      });

      if (sampleRows.length) {
        detailItems.push(`Sample pricing: ${sampleRows.join(" • ")}`);
      }
    }

    if (service.notes?.length) {
      detailItems.push(...service.notes);
    }

    return detailItems;
  };

  const details = getDetails();

  return (
    <div className="service-card">
      {service.image ? (
        <div className="service-card-image">
          <img src={service.image} alt={service.name} />
        </div>
      ) : null}
      <div className="service-card-content">
        <h4>{service.name}</h4>
        <p className="service-card-description">{getDescription()}</p>
        <span className="service-card-price">{getPriceLabel()}</span>
        {details.length > 0 ? (
          <ul className="service-card-details">
            {details.map((detail, index) => (
              <li
                key={`${service.id}-${index}`}
                className="service-card-detail-item"
              >
                {detail}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
};

export default ServiceCard;
