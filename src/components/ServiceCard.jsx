//card for services on home page (reusable)

const ServiceCard = ({ tag, title, description, price }) => {
  return (
    <article className="service-card">
      {tag && <span className="service-tag">{tag}</span>}
      <div className="service-card-body">
        <h3 className="service-title">{title}</h3>
        <p className="service-desc">{description}</p>
        {price && <p className="service-price">Starting from {price}</p>}
      </div>
    </article>
  );
};

export default ServiceCard;
