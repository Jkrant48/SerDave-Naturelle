import { useMemo, useState } from "react";

const services = [
  "Loc Maintenance",
  "Braids",
  "Hair Treatment",
  "Custom Styling",
];

const timeSlots = ["09:00", "10:30", "12:00", "14:00", "16:30"];

const calendarDays = [
  { date: 1, status: "available" },
  { date: 2, status: "closed" },
  { date: 3, status: "booked" },
  { date: 4, status: "available" },
  { date: 5, status: "available" },
  { date: 6, status: "booked" },
  { date: 7, status: "available" },
  { date: 8, status: "closed" },
  { date: 9, status: "available" },
  { date: 10, status: "available" },
  { date: 11, status: "booked" },
  { date: 12, status: "available" },
  { date: 13, status: "available" },
  { date: 14, status: "available" },
  { date: 15, status: "booked" },
  { date: 16, status: "available" },
  { date: 17, status: "closed" },
  { date: 18, status: "available" },
  { date: 19, status: "available" },
  { date: 20, status: "booked" },
  { date: 21, status: "available" },
  { date: 22, status: "available" },
  { date: 23, status: "available" },
  { date: 24, status: "booked" },
  { date: 25, status: "available" },
  { date: 26, status: "closed" },
  { date: 27, status: "available" },
  { date: 28, status: "available" },
  { date: 29, status: "booked" },
  { date: 30, status: "available" },
];

const BookingForm = () => {
  const [selectedService, setSelectedService] = useState(services[0]);
  const [selectedDate, setSelectedDate] = useState(4);
  const [selectedTime, setSelectedTime] = useState(timeSlots[1]);

  const selectedStatus = useMemo(() => {
    return (
      calendarDays.find((day) => day.date === selectedDate)?.status ||
      "available"
    );
  }, [selectedDate]);

  return (
    <section className="booking-section">
      <div className="booking-card">
        <div className="booking-calendar">
          <div className="calendar-legend">
            <span>
              <span className="legend-dot available"></span> Available
            </span>
            <span>
              <span className="legend-dot booked"></span> Fully booked
            </span>
            <span>
              <span className="legend-dot closed"></span> Closed
            </span>
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day) => (
              <button
                key={day.date}
                type="button"
                className={`calendar-day ${day.status} ${selectedDate === day.date ? "selected" : ""}`}
                onClick={() => setSelectedDate(day.date)}
                disabled={day.status === "booked"}
              >
                <span>{day.date}</span>
              </button>
            ))}
          </div>
        </div>

        <form className="booking-form">
          <div className="form-group">
            <label className="form-label" htmlFor="service">
              Select service
            </label>
            <select
              id="service"
              className="form-input"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Selected date</label>
            <div className="selected-summary">
              <strong>June {selectedDate}</strong>
              <span className="status-pill">{selectedStatus}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="time">
              Available time
            </label>
            <select
              id="time"
              className="form-input"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              className="form-input"
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              className="form-input"
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="notes">
              Notes / requests
            </label>
            <textarea
              id="notes"
              className="form-textarea"
              rows="4"
              placeholder="Tell us about your preferred style or any special requests"
            />
          </div>

          <button type="submit" className="form-submit">
            Confirm booking
          </button>
        </form>
      </div>
    </section>
  );
};

export default BookingForm;
