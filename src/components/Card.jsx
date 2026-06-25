// card for services on home page (reusable)

const ServiceCard = ({ tag, title, description, price, image }) => {
  const cardImage = image || "https://via.placeholder.com/300x200"; // Default image if none provided

  return (
    <article className="card">
      {tag && <span className="card-tag">{tag}</span>}
      <div className="card-body">
        <img src={cardImage} alt={title} className="card-img" />
        <h3 className="card-title">{title}</h3>
        <p className="card-desc">{description}</p>
        {price && <p className="card-price">Starting from {price}</p>}
      </div>
    </article>
  );
};

export default ServiceCard;
