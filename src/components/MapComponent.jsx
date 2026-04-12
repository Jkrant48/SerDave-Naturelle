import React from "react";

const MapComponent = () => {
  return (
    <section className="map-section">
      <div className="map-inner">
        <h2 className="map-heading">Our Location</h2>
        <div className="map-container">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d295.05975036938435!2d-0.17511672434788306!3d5.736890029340444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf77375d71021d%3A0xe8ac0bba73b6bade!2sSerDave%20Naturelle!5e0!3m2!1sen!2sgh!4v1776028032916!5m2!1sen!2sgh"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
        <p className="map-address">Oyarifa Crossing, Accra, Ghana</p>
      </div>
    </section>
  );
};

export default MapComponent;
