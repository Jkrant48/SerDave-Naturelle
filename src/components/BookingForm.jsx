import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import salonData from "../json/salon.json";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const businessHours = salonData.businessHours || [];
const slotIntervalMinutes = salonData.booking?.slotInterval || 30;
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(Number(value));

const getMainServiceType = (categoryName) => {
  const name = categoryName.toLowerCase();
  if (/\btreatment(s)?\b/.test(name)) return "treatment";
  if (/\bbraid(s)?\b/.test(name)) return "braids";
  if (/\bloc(s)?\b/.test(name)) return "locs";
  return null;
};

const mainServiceTypes = [
  { id: "treatment", label: "Treatment" },
  { id: "braids", label: "Braids" },
  { id: "locs", label: "Locs" },
];

const bookingSteps = [
  { id: "schedule", label: "Date & time" },
  { id: "service", label: "Service" },
  { id: "contact", label: "Your details" },
  { id: "payment", label: "Summary & payment" },
  { id: "confirmed", label: "Confirmed" },
];

const timeFromMinutes = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getOpenSlots = (dayName) => {
  const schedule = businessHours.find((entry) => entry.day === dayName);

  if (!schedule || schedule.closed || !schedule.open || !schedule.close) {
    return [];
  }

  const [openHour, openMinute] = schedule.open.split(":").map(Number);
  const [closeHour, closeMinute] = schedule.close.split(":").map(Number);
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  const slots = [];
  for (
    let minuteValue = openMinutes;
    minuteValue < closeMinutes;
    minuteValue += slotIntervalMinutes
  ) {
    slots.push(timeFromMinutes(minuteValue));
  }

  return slots;
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCalendarDaysForMonth = (monthDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: totalDays }, (_, index) => {
    const dateNumber = index + 1;
    const date = new Date(year, month, dateNumber);
    date.setHours(0, 0, 0, 0);

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const schedule = businessHours.find((entry) => entry.day === dayName);
    const isPast = date < today;

    return {
      key: formatDateKey(date),
      date: dateNumber,
      fullDate: date,
      monthLabel: date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      dayName,
      status: isPast ? "past" : schedule?.closed ? "closed" : "available",
    };
  });
};

const BookingForm = () => {
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewMonth, setViewMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedMainType, setSelectedMainType] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedAddOnIds, setSelectedAddOnIds] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    const initialMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const availableDay = getCalendarDaysForMonth(initialMonth).find(
      (day) => day.status === "available",
    );

    return availableDay ? availableDay.key : formatDateKey(today);
  });
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [depositAccepted, setDepositAccepted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState(false);
  const paymentPopupRef = useRef(null);

  const getMainCategory = (type) =>
    categories.find(
      (category) =>
        getMainServiceType(category.name) === type &&
        category.services.length > 0,
    );

  const selectedService = services.find(
    (service) => String(service.id) === selectedServiceId,
  );
  const mainCategories = categories.filter((category) =>
    getMainServiceType(category.name) && category.services.length > 0,
  );
  const availableMainTypes = mainServiceTypes.filter((type) =>
    mainCategories.some((category) => getMainServiceType(category.name) === type.id),
  );
  const mainServices = mainCategories
    .filter((category) => getMainServiceType(category.name) === selectedMainType)
    .flatMap((category) =>
      category.services.map((service) => ({
        ...service,
        categoryName: category.name,
      })),
    );
  const addOnServices = services.filter(
    (service) => !getMainServiceType(service.categoryName),
  );
  const selectedAddOns = addOnServices.filter((service) =>
    selectedAddOnIds.includes(String(service.id)),
  );

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/services", { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Could not load services.");
        }
        return result;
      })
      .then((catalog) => {
        setCategories(catalog.categories);
        setServices(catalog.services);
        const firstMainCategory = catalog.categories.find(
          (category) =>
            getMainServiceType(category.name) && category.services.length,
        );
        const firstMainType = firstMainCategory
          ? getMainServiceType(firstMainCategory.name)
          : "";
        setSelectedMainType(firstMainType);
        setSelectedServiceId(
          String(firstMainCategory?.services[0]?.id || ""),
        );
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setSubmitError(true);
          setSubmitMessage(error.message || "Could not load services.");
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handlePaymentResult = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== paymentPopupRef.current) return;
      if (event.data?.type !== "booking-payment-result") return;

      setCheckoutOpen(false);
      setIsSubmitting(false);
      setSubmitError(!event.data.success);
      setSubmitMessage(event.data.message);
      paymentPopupRef.current = null;
      if (event.data.success) {
        setPaymentConfirmed(true);
        setActiveStep(bookingSteps.length - 1);
        window.alert(event.data.message);
      }
    };

    window.addEventListener("message", handlePaymentResult);
    return () => window.removeEventListener("message", handlePaymentResult);
  }, []);

  useEffect(() => {
    if (!checkoutOpen) return undefined;

    const closeCheck = window.setInterval(() => {
      if (paymentPopupRef.current?.closed) {
        paymentPopupRef.current = null;
        setCheckoutOpen(false);
        setIsSubmitting(false);
        setSubmitError(true);
        setSubmitMessage(
          "The Paystack payment window was closed before the deposit was confirmed. You can try again.",
        );
      }
    }, 500);

    return () => window.clearInterval(closeCheck);
  }, [checkoutOpen]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const reference = query.get("reference") || query.get("trxref");
    if (!reference) return undefined;

    let isCurrent = true;
    setIsSubmitting(true);
    setSubmitError(false);
    setSubmitMessage("Verifying your deposit payment...");

    const clearPaymentReference = () => {
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.delete("reference");
      returnUrl.searchParams.delete("trxref");
      window.history.replaceState(
        {},
        "",
        `${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`,
      );
    };

    fetch(
      `${API_BASE_URL}/api/bookings/verify?reference=${encodeURIComponent(reference)}`,
    )
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Could not verify your deposit payment.");
        }
        return result;
      })
      .then(() => {
        if (!isCurrent) return;
        clearPaymentReference();
        const confirmation =
          "Your GH₵50 deposit is confirmed and your appointment is secured. We’ll contact you shortly.";
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            { type: "booking-payment-result", success: true, message: confirmation },
            window.location.origin,
          );
          window.close();
          return;
        }
        setPaymentConfirmed(true);
        setActiveStep(bookingSteps.length - 1);
        setSubmitError(false);
        setSubmitMessage(confirmation);
        window.alert(confirmation);
      })
      .catch((error) => {
        if (!isCurrent) return;
        clearPaymentReference();
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            {
              type: "booking-payment-result",
              success: false,
              message: error.message || "Could not verify your deposit payment.",
            },
            window.location.origin,
          );
          window.close();
          return;
        }
        setSubmitError(true);
        setSubmitMessage(error.message || "Could not verify your deposit payment.");
      })
      .finally(() => {
        if (isCurrent) setIsSubmitting(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const visibleMonths = useMemo(
    () => [new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)],
    [viewMonth],
  );

  const calendarDays = useMemo(
    () =>
      visibleMonths.flatMap((monthDate) => getCalendarDaysForMonth(monthDate)),
    [visibleMonths],
  );

  const selectedDay = useMemo(
    () => calendarDays.find((day) => day.key === selectedDateKey) || null,
    [calendarDays, selectedDateKey],
  );

  const timeSlots = useMemo(
    () => (selectedDay ? getOpenSlots(selectedDay.dayName) : []),
    [selectedDay],
  );

  const activeTime = timeSlots.includes(selectedTime)
    ? selectedTime
    : timeSlots[0] || "";

  const selectedStatus = selectedDay?.status || "available";
  const isDateAvailable = selectedStatus === "available";
  const isPastDate = selectedStatus === "past";
  const canSubmit =
    isDateAvailable &&
    customerName.trim().length > 0 &&
    customerEmail.trim().length > 0 &&
    customerPhone.trim().length > 0 &&
    depositAccepted &&
    !!selectedServiceId &&
    !!selectedMainType &&
    !!activeTime;

  const goToNextStep = (event) => {
    if (activeStep === 0 && (!isDateAvailable || !activeTime)) {
      setSubmitError(true);
      setSubmitMessage("Choose an available date and time to continue.");
      return;
    }
    if (activeStep === 1 && (!selectedService || !selectedMainType)) {
      setSubmitError(true);
      setSubmitMessage("Choose a main service to continue.");
      return;
    }
    if (activeStep === 2) {
      const form = event.currentTarget.closest("form");
      if (!form.reportValidity()) return;
    }

    setSubmitError(false);
    setSubmitMessage("");
    setActiveStep((step) => Math.min(step + 1, bookingSteps.length - 1));
  };

  const goToPreviousMonth = () => {
    setViewMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setViewMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }
    if (activeStep < bookingSteps.length - 1) {
      goToNextStep(event);
      return;
    }

    if (!canSubmit) {
      setSubmitError(true);
      setSubmitMessage(
        !depositAccepted
          ? "Please acknowledge that the GH₵50 deposit is non-refundable to continue."
          : "Please complete the date, service, and contact details before paying.",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");
    setSubmitError(false);
    const paymentPopup = window.open(
      "about:blank",
      "paystack-checkout",
      "popup=yes,width=520,height=760,resizable=yes,scrollbars=yes",
    );
    if (!paymentPopup) {
      setIsSubmitting(false);
      setSubmitError(true);
      setSubmitMessage(
        "Your browser blocked the Paystack popup. Allow popups for this website, then try again.",
      );
      return;
    }
    paymentPopupRef.current = paymentPopup;

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          serviceId: selectedServiceId,
          addOnServiceIds: selectedAddOnIds,
          bookingDate: selectedDateKey,
          bookingTime: activeTime,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Could not submit your appointment.");
      }
      if (!result.authorizationUrl) {
        throw new Error("Could not open the Paystack payment page.");
      }
      paymentPopup.location.href = result.authorizationUrl;
      setCheckoutOpen(true);
      setSubmitMessage(
        "Paystack opened in a new window. Complete the GH₵50 deposit there to secure your appointment.",
      );
    } catch (error) {
      paymentPopup.close();
      paymentPopupRef.current = null;
      setSubmitError(true);
      setSubmitMessage(error.message || "Could not reach the booking service.");
    } finally {
      if (!paymentPopupRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <section className="booking-section">
      <div className={`booking-card ${activeStep > 0 ? "booking-card-wide" : ""}`}>
        <nav className="booking-stepper" aria-label="Booking progress">
          <div
            className="booking-stepper-progress"
            aria-hidden="true"
            style={{
              "--booking-progress":
                `${(activeStep / (bookingSteps.length - 1)) * 100}%`,
            }}
          />
          {bookingSteps.map((step, index) => (
            <button
              type="button"
              key={step.id}
              className={`booking-step ${
                index === activeStep ? "active" : ""
              } ${index < activeStep ? "complete" : ""}`}
              aria-current={index === activeStep ? "step" : undefined}
              onClick={() => {
                if (index < activeStep && !checkoutOpen) {
                  setSubmitError(false);
                  setSubmitMessage("");
                  setActiveStep(index);
                }
              }}
              disabled={index >= activeStep || checkoutOpen || paymentConfirmed}
            >
              <span className="booking-step-number">
                {index < activeStep ? "✓" : index + 1}
              </span>
              <span>{step.label}</span>
            </button>
          ))}
        </nav>

        <div className="booking-calendar" hidden={activeStep !== 0}>
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

          <div className="calendar-header">
            <button
              type="button"
              className="calendar-nav-button"
              onClick={goToPreviousMonth}
              aria-label="Previous month"
            >
              ←
            </button>

            <div className="calendar-months-grid">
              {visibleMonths.map((monthDate) => (
                <div
                  key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
                  className="calendar-month-panel"
                >
                  <h4 className="calendar-month-label">
                    {monthDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h4>

                  <div className="calendar-grid">
                    {getCalendarDaysForMonth(monthDate).map((day) => (
                      <button
                        key={day.key}
                        type="button"
                        className={`calendar-day ${day.status} ${
                          selectedDateKey === day.key ? "selected" : ""
                        }`}
                        onClick={() => {
                          if (day.status === "available") {
                            setSelectedDateKey(day.key);
                          }
                        }}
                        disabled={day.status !== "available"}
                        aria-label={`${day.dayName} ${day.date}`}
                      >
                        <span>{day.date}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="calendar-nav-button"
              onClick={goToNextMonth}
              aria-label="Next month"
            >
              →
            </button>
          </div>
        </div>

        <form className="booking-form" onSubmit={handleSubmit}>
          <section className="booking-step-panel" hidden={activeStep !== 0}>
            <div className="booking-step-heading">
              <span>STEP 1 OF 4</span>
              <h2>When would you like to visit?</h2>
              <p>Choose an open date and a time that works for you.</p>
            </div>
            <div className="form-group">
              <label className="form-label">Selected date</label>
              <div className="selected-summary">
                <strong>
                  {selectedDay?.fullDate?.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  }) || "Not selected"}
                </strong>
                <span className={`status-pill ${selectedStatus}`}>
                  {selectedStatus === "available" ? "Open" : "Closed"}
                </span>
              </div>
              {!isDateAvailable && (
                <p className="form-note">
                  {isPastDate
                    ? "This date has already passed. Please choose a future available date."
                    : selectedDay?.dayName
                      ? `${selectedDay.dayName} is closed based on the salon schedule.`
                      : "Please choose a date marked as available."}
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="time">
                Pick a time
              </label>
              <select
                id="time"
                className="form-input"
                value={activeTime}
                onChange={(event) => setSelectedTime(event.target.value)}
                disabled={!isDateAvailable || timeSlots.length === 0}
              >
                {timeSlots.length ? (
                  timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))
                ) : (
                  <option value="">Closed</option>
                )}
              </select>
            </div>
          </section>

          <section className="booking-step-panel" hidden={activeStep !== 1}>
            <div className="booking-step-heading">
              <span>STEP 2 OF 4</span>
              <h2>Choose your service</h2>
              <p>Select one main service and any optional add-ons.</p>
            </div>
          <div className="form-group">
            <label className="form-label" htmlFor="main-service-type">
              Choose a main service
            </label>
            <select
              id="main-service-type"
              className="form-input"
              value={selectedMainType}
              onChange={(event) => {
                const type = event.target.value;
                const category = getMainCategory(type);
                setSelectedMainType(type);
                setSelectedServiceId(String(category?.services[0]?.id || ""));
              }}
            >
              <option value="" disabled>
                {availableMainTypes.length
                  ? "Choose Treatment, Braids, or Locs"
                  : "No main services available"}
              </option>
              {availableMainTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
            <label className="form-label" htmlFor="service">
              Pick a service
            </label>
            <select
              id="service"
              className="form-input"
              value={selectedServiceId}
              onChange={(event) => setSelectedServiceId(event.target.value)}
              disabled={!mainServices.length}
            >
              <option value="" disabled>
                {mainServices.length ? "Choose a service" : "No services in this category"}
              </option>
              {mainServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {mainCategories.filter(
                    (category) =>
                      getMainServiceType(category.name) === selectedMainType,
                  ).length > 1
                    ? `${service.categoryName}: `
                    : ""}
                  {service.serviceName} - {formatCurrency(service.price)}
                </option>
              ))}
            </select>
            {selectedService?.description && (
              <p className="form-note">{selectedService.description}</p>
            )}
          </div>

          <div className="form-group">
            <span className="form-label">Optional add-ons</span>
            {addOnServices.length ? (
              <div className="booking-add-on-list">
                {addOnServices.map((service) => {
                  const serviceId = String(service.id);
                  return (
                    <label className="booking-add-on" key={service.id}>
                      <input
                        type="checkbox"
                        checked={selectedAddOnIds.includes(serviceId)}
                        onChange={(event) => {
                          setSelectedAddOnIds((current) =>
                            event.target.checked
                              ? [...current, serviceId]
                              : current.filter((id) => id !== serviceId),
                          );
                        }}
                      />
                      <span>
                        <strong>{service.serviceName}</strong>
                        <small>{service.categoryName}</small>
                      </span>
                      <span>{formatCurrency(service.price)}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="form-note">No add-on services are currently available.</p>
            )}
          </div>
          </section>

          <section className="booking-step-panel" hidden={activeStep !== 2}>
            <div className="booking-step-heading">
              <span>STEP 3 OF 4</span>
              <h2>How can we reach you?</h2>
              <p>Enter your contact details for appointment updates.</p>
            </div>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              className="form-input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your name"
              required={activeStep === 2}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="booking-email">
              Email address
            </label>
            <input
              id="booking-email"
              className="form-input"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Enter your email address"
              required={activeStep === 2}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              className="form-input"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter your phone number"
              required={activeStep === 2}
              type="tel"
            />
          </div>

          </section>

          <section className="booking-step-panel" hidden={activeStep !== 3}>
            <div className="booking-step-heading">
              <span>STEP 4 OF 4</span>
              <h2>Review and secure your appointment</h2>
              <p>Check the details, then pay your non-refundable deposit.</p>
            </div>
          <div className="booking-summary">
            <h3>Appointment summary</h3>
            <div className="booking-summary-item">
              <span className="summary-label">Service</span>
              <span>{selectedService?.serviceName || "Not selected"}</span>
            </div>
            {selectedService && (
              <>
                <div className="booking-summary-item">
                  <span className="summary-label">Category</span>
                  <span>{selectedService.categoryName}</span>
                </div>
                <div className="booking-summary-item">
                  <span className="summary-label">Listed price</span>
                  <span>{formatCurrency(selectedService.price)}</span>
                </div>
              </>
            )}
            {selectedAddOns.length > 0 && (
              <>
                <div className="booking-summary-item">
                  <span className="summary-label">Add-ons</span>
                  <span>
                    {selectedAddOns.map((service) => service.serviceName).join(", ")}
                  </span>
                </div>
                <div className="booking-summary-item">
                  <span className="summary-label">Add-on total</span>
                  <span>
                    {formatCurrency(
                      selectedAddOns.reduce(
                        (total, service) => total + Number(service.price),
                        0,
                      ),
                    )}
                  </span>
                </div>
              </>
            )}
            {selectedService && (
              <div className="booking-summary-item booking-summary-total">
                <strong>Total listed price</strong>
                <strong>
                  {formatCurrency(
                    [selectedService, ...selectedAddOns].reduce(
                      (total, service) => total + Number(service.price),
                      0,
                    ),
                  )}
                </strong>
              </div>
            )}
            {selectedService && (
              <div className="booking-summary-item">
                <span className="summary-label">Non-refundable deposit</span>
                <span>{formatCurrency(50)}</span>
              </div>
            )}
            <div className="booking-summary-item">
              <span className="summary-label">Date</span>
              <span>
                {selectedDay?.fullDate?.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                }) || "Not selected"}
              </span>
            </div>
            <div className="booking-summary-item">
              <span className="summary-label">Time</span>
              <span>{activeTime || "Not selected"}</span>
            </div>
            <div className="booking-summary-item">
              <span className="summary-label">Name</span>
              <span>{customerName || "Not provided"}</span>
            </div>
            <div className="booking-summary-item">
              <span className="summary-label">Phone</span>
              <span>{customerPhone || "Not provided"}</span>
            </div>
          </div>

          <label className="booking-deposit-consent">
            <input
              type="checkbox"
              checked={depositAccepted}
              onChange={(event) => setDepositAccepted(event.target.checked)}
            />
            <span>
              I understand the GH₵50 deposit is non-refundable and will be
              applied to my appointment total.
            </span>
          </label>
          </section>

          <section
            className="booking-step-panel booking-confirmation"
            hidden={activeStep !== 4 || !paymentConfirmed}
            aria-live="polite"
          >
            <div className="booking-confirmation-heading">
              <span className="booking-paid-icon" aria-hidden="true">✓</span>
              <div>
                <span className="booking-paid-status">Payment confirmed</span>
                <h2>Your appointment is secured</h2>
                <p>Your non-refundable GH₵50 deposit has been received.</p>
                <p className="booking-screenshot-note">
                  Take a screenshot of this page for your appointment records.
                </p>
              </div>
            </div>
            <div className="booking-confirmation-summary">
              <h3>Appointment summary</h3>
              <div className="booking-summary-item">
                <span className="summary-label">Service</span>
                <span>{selectedService?.serviceName || "—"}</span>
              </div>
              {selectedAddOns.length > 0 && (
                <div className="booking-summary-item">
                  <span className="summary-label">Add-ons</span>
                  <span>
                    {selectedAddOns.map((service) => service.serviceName).join(", ")}
                  </span>
                </div>
              )}
              <div className="booking-summary-item">
                <span className="summary-label">Date</span>
                <span>
                  {selectedDay?.fullDate?.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }) || "—"}
                </span>
              </div>
              <div className="booking-summary-item">
                <span className="summary-label">Time</span>
                <span>{activeTime || "—"}</span>
              </div>
              <div className="booking-summary-item">
                <span className="summary-label">Name</span>
                <span>{customerName || "—"}</span>
              </div>
              <div className="booking-summary-item">
                <span className="summary-label">Email</span>
                <span>{customerEmail || "—"}</span>
              </div>
              <div className="booking-summary-item">
                <span className="summary-label">Phone</span>
                <span>{customerPhone || "—"}</span>
              </div>
              <div className="booking-summary-item booking-summary-total">
                <strong>Deposit paid</strong>
                <strong>{formatCurrency(50)}</strong>
              </div>
              {selectedService && (
                <div className="booking-summary-item">
                  <span className="summary-label">Appointment total</span>
                  <span>
                    {formatCurrency(
                      [selectedService, ...selectedAddOns].reduce(
                        (total, service) => total + Number(service.price),
                        0,
                      ),
                    )}
                  </span>
                </div>
              )}
            </div>
          </section>

          {submitMessage && (
            <p className={`form-note ${submitError ? "booking-error" : ""}`} role={submitError ? "alert" : "status"}>
              {submitMessage}
            </p>
          )}

          <div className="booking-step-actions">
            {activeStep > 0 && !checkoutOpen && !paymentConfirmed && (
              <button
                type="button"
                className="booking-back-button"
                onClick={() => {
                  setSubmitError(false);
                  setSubmitMessage("");
                  setActiveStep((step) => Math.max(step - 1, 0));
                }}
              >
                Back
              </button>
            )}
            {activeStep < bookingSteps.length - 1 && (
              <button
                type="button"
                className="form-submit booking-next-button"
                onClick={goToNextStep}
                disabled={isSubmitting || checkoutOpen}
              >
                Continue
              </button>
            )}
            {activeStep === bookingSteps.length - 1 && paymentConfirmed && (
              <button
                type="button"
                className="form-submit booking-done-button"
                onClick={() => navigate("/")}
              >
                Done
              </button>
            )}
            {activeStep === bookingSteps.length - 1 && !paymentConfirmed && (
              <button
                type="submit"
                className="form-submit"
                disabled={isSubmitting || checkoutOpen}
              >
                {checkoutOpen
                  ? "Complete payment in Paystack"
                  : isSubmitting
                    ? "Starting Paystack..."
                    : "Pay GH₵50 non-refundable deposit"}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
};

export default BookingForm;
