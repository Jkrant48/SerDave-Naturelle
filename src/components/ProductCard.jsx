const ProductCard = ({ title, description, image, imageAlt }) => {
  return (
    <article className="p-card">
      <div className="p-card-body">
        {image && (
          <img src={image} alt={imageAlt || title} className="p-card-img" />
        )}
        <div className="p-card-content">
          <h3 className="p-card-title">{title}</h3>
          <p className="p-card-desc">{description}</p>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
