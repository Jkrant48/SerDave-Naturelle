// This route provides the admin login and management screens added for salon operations.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../lib/api.js";
import "../admin.css";

const emptyService = {
  serviceName: "",
  description: "",
  price: "",
  depositAmount: "",
  durationMinutes: "",
  categoryId: "",
  active: true,
};

const adminSections = [
  { id: "employees", label: "Employee management" },
  { id: "appointments", label: "Appointments" },
  { id: "services", label: "Services management" },
  { id: "categories", label: "Category management" },
  { id: "portfolio", label: "Upload image" },
];

function PasswordToggle({ visible, onToggle, label }) {
  return (
    <button
      type="button"
      className="password-toggle"
      onClick={onToggle}
      aria-label={`${visible ? "Hide" : "Show"} ${label}`}
      aria-pressed={visible}
      title={`${visible ? "Hide" : "Show"} ${label}`}
    >
      {visible ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
          <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.5 0 9 7 9 7a15.5 15.5 0 01-3.1 3.8M6.2 6.2C3.9 7.8 3 12 3 12s3.5 7 9 7a10.8 10.8 0 004.1-.8" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

async function apiRequest(path, options = {}) {
  const { json, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers || {});
  let body = requestOptions.body;
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  }

  const response = await fetch(apiUrl(path), {
    ...requestOptions,
    headers,
    body,
    credentials: "include",
  });
  if (response.status === 204) {
    return null;
  }

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "The request could not be completed.");
  }
  return result;
}

function AdminPage() {
  const [admin, setAdmin] = useState(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [activeSection, setActiveSection] = useState("appointments");
  const [showPasswords, setShowPasswords] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [firstAdminForm, setFirstAdminForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [categoryForm, setCategoryForm] = useState({ id: null, name: "" });
  const [serviceForm, setServiceForm] = useState({ id: null, ...emptyService });
  const [employeeForm, setEmployeeForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    description: "",
    serviceId: "",
    image: null,
  });

  const loadDashboard = useCallback(async () => {
    const result = await apiRequest("/api/admin");
    setDashboard(result);
  }, []);

  useEffect(() => {
    let isMounted = true;
    apiRequest("/api/admin/session")
      .then(async ({ admin: signedInAdmin }) => {
        if (!isMounted) return;
        setAdmin(signedInAdmin);
        const result = await apiRequest("/api/admin");
        if (isMounted) setDashboard(result);
      })
      .catch((error) => {
        if (error.message === "Admin login required.") {
          return apiRequest("/api/admin/setup-status").then((result) => {
            if (isMounted) setSetupRequired(result.setupRequired);
          });
        }
        throw error;
      })
      .catch((error) => {
        if (isMounted) setErrorMessage(error.message);
      })
      .finally(() => {
        if (isMounted) setIsCheckingSession(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const runAdminAction = async (action, successMessage) => {
    setIsWorking(true);
    setErrorMessage("");
    setNotice("");
    try {
      await action();
      await loadDashboard();
      setNotice(successMessage);
      return true;
    } catch (error) {
      setErrorMessage(error.message);
      return false;
    } finally {
      setIsWorking(false);
    }
  };

  const signIn = async (event) => {
    event.preventDefault();
    await runAdminAction(async () => {
      const result = await apiRequest("/api/admin/login", {
        method: "POST",
        json: login,
      });
      setAdmin(result.admin);
      setLogin((current) => ({ ...current, password: "" }));
    }, "Signed in.");
  };

  const createFirstAdmin = async (event) => {
    event.preventDefault();
    if (firstAdminForm.password !== firstAdminForm.confirmPassword) {
      setErrorMessage("The admin passwords do not match.");
      return;
    }

    setIsWorking(true);
    setErrorMessage("");
    setNotice("");
    try {
      const result = await apiRequest("/api/admin/setup", {
        method: "POST",
        json: {
          email: firstAdminForm.email,
          password: firstAdminForm.password,
        },
      });
      setAdmin(result.admin);
      setSetupRequired(false);
      setFirstAdminForm({ email: "", password: "", confirmPassword: "" });
      try {
        await loadDashboard();
        setNotice("First admin account created.");
      } catch (error) {
        setErrorMessage(`Admin account created, but the dashboard could not load: ${error.message}`);
      }
    } catch (error) {
      setErrorMessage(error.message);
      if (error.message === "Admin setup is already complete. Sign in instead.") {
        setSetupRequired(false);
      }
    } finally {
      setIsWorking(false);
    }
  };

  const signOut = async () => {
    setIsWorking(true);
    setErrorMessage("");
    try {
      await apiRequest("/api/admin/logout", { method: "POST" });
      setAdmin(null);
      setDashboard(null);
      setNotice("Signed out.");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsWorking(false);
    }
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    const editing = categoryForm.id !== null;
    const saved = await runAdminAction(
      () =>
        apiRequest(
          editing
            ? `/api/admin/categories/${categoryForm.id}`
            : "/api/admin/categories",
          {
            method: editing ? "PUT" : "POST",
            json: { name: categoryForm.name },
          },
        ),
      editing ? "Category updated." : "Category added.",
    );
    if (saved) setCategoryForm({ id: null, name: "" });
  };

  const removeCategory = async (category) => {
    if (!window.confirm(`Delete the "${category.name}" category?`)) return;
    const saved = await runAdminAction(
      () =>
        apiRequest(`/api/admin/categories/${category.id}`, {
          method: "DELETE",
        }),
      "Category deleted.",
    );
  };

  const saveService = async (event) => {
    event.preventDefault();
    const editing = serviceForm.id !== null;
    const payload = {
      serviceName: serviceForm.serviceName,
      description: serviceForm.description,
      price: Number(serviceForm.price),
      depositAmount: Number(serviceForm.depositAmount),
      durationMinutes: Number(serviceForm.durationMinutes),
      categoryId: Number(serviceForm.categoryId),
      active: serviceForm.active,
    };
    await runAdminAction(
      () =>
        apiRequest(
          editing ? `/api/admin/services/${serviceForm.id}` : "/api/admin/services",
          {
            method: editing ? "PUT" : "POST",
            json: payload,
          },
        ),
      editing ? "Service updated." : "Service added.",
    );
    if (saved) setServiceForm({ id: null, ...emptyService });
  };

  const createEmployee = async (event) => {
    event.preventDefault();
    if (employeeForm.password !== employeeForm.confirmPassword) {
      setErrorMessage("The employee passwords do not match.");
      return;
    }

    const saved = await runAdminAction(
      () =>
        apiRequest("/api/admin/employees", {
          method: "POST",
          json: {
            email: employeeForm.email,
            password: employeeForm.password,
          },
        }),
      "Employee account created. Share the initial password securely.",
    );
    if (saved) {
      setEmployeeForm({ email: "", password: "", confirmPassword: "" });
    }
  };

  const removeService = async (service) => {
    if (!window.confirm(`Remove "${service.serviceName}" from the public services list?`)) {
      return;
    }
    await runAdminAction(
      () =>
        apiRequest(`/api/admin/services/${service.id}`, {
          method: "DELETE",
        }),
      "Service removed from the public list.",
    );
  };

  const savePortfolioItem = async (event) => {
    event.preventDefault();
    if (!portfolioForm.image) {
      setErrorMessage("Choose an image to upload.");
      return;
    }

    const form = event.currentTarget;
    setIsWorking(true);
    setErrorMessage("");
    setNotice("");
    let uploaded;
    try {
      uploaded = await apiRequest("/api/admin/portfolio-image", {
        method: "POST",
        headers: { "Content-Type": portfolioForm.image.type },
        body: portfolioForm.image,
      });
    } catch (error) {
      setErrorMessage(error.message);
      setIsWorking(false);
      return;
    }

    try {
      await apiRequest("/api/admin/portfolio", {
        method: "POST",
        json: {
          title: portfolioForm.title,
          description: portfolioForm.description,
          serviceId: portfolioForm.serviceId,
          storagePath: uploaded.storagePath,
        },
      });
    } catch (error) {
      let message = error.message;
      try {
        await apiRequest(
          `/api/admin/portfolio-image/${encodeURIComponent(uploaded.storagePath)}`,
          { method: "DELETE" },
        );
      } catch (cleanupError) {
        message += ` Image cleanup also failed: ${cleanupError.message}`;
      }
      setErrorMessage(message);
      setIsWorking(false);
      return;
    }

    setPortfolioForm({ title: "", description: "", serviceId: "", image: null });
    form.reset();
    try {
      await loadDashboard();
      setNotice("Portfolio image uploaded and published.");
    } catch (error) {
      setErrorMessage(`Portfolio image was published, but the dashboard could not refresh: ${error.message}`);
    }
    setIsWorking(false);
  };

  if (isCheckingSession) {
    return <main className="admin-shell"><p role="status">Checking admin session...</p></main>;
  }

  if (!admin) {
    return (
      <main className="admin-shell">
        <section className="admin-panel admin-login">
          <p className="admin-eyebrow">SerDave Naturelle</p>
          <h1>{setupRequired ? "Create the first admin account" : "Admin sign in"}</h1>
          <p>
            {setupRequired
              ? "No admin account exists yet. Set up the first account to secure admin access."
              : "Sign in with your admin account."}
          </p>
          {errorMessage && <p className="admin-message error" role="alert">{errorMessage}</p>}
          {setupRequired ? (
            <form onSubmit={createFirstAdmin} className="admin-form">
              <label>
                Admin email
                <input
                  type="email"
                  autoComplete="username"
                  maxLength="255"
                  required
                  value={firstAdminForm.email}
                  onChange={(event) =>
                    setFirstAdminForm({ ...firstAdminForm, email: event.target.value })
                  }
                />
              </label>
              <label>
                Password (at least 12 characters)
                <span className="password-field">
                  <input
                    type={showPasswords ? "text" : "password"}
                    autoComplete="new-password"
                    minLength="12"
                    maxLength="1024"
                    required
                    value={firstAdminForm.password}
                    onChange={(event) =>
                      setFirstAdminForm({ ...firstAdminForm, password: event.target.value })
                    }
                  />
                  <PasswordToggle
                    visible={showPasswords}
                    onToggle={() => setShowPasswords((visible) => !visible)}
                    label="password"
                  />
                </span>
              </label>
              <label>
                Confirm password
                <span className="password-field">
                  <input
                    type={showPasswords ? "text" : "password"}
                    autoComplete="new-password"
                    minLength="12"
                    maxLength="1024"
                    required
                    value={firstAdminForm.confirmPassword}
                    onChange={(event) =>
                      setFirstAdminForm({
                        ...firstAdminForm,
                        confirmPassword: event.target.value,
                      })
                    }
                  />
                  <PasswordToggle
                    visible={showPasswords}
                    onToggle={() => setShowPasswords((visible) => !visible)}
                    label="password"
                  />
                </span>
              </label>
              {firstAdminForm.confirmPassword && (
                <p
                  className={`password-match ${
                    firstAdminForm.password === firstAdminForm.confirmPassword
                      ? "matches"
                      : "does-not-match"
                  }`}
                  role="status"
                >
                  {firstAdminForm.password === firstAdminForm.confirmPassword
                    ? "Passwords match."
                    : "Passwords do not match."}
                </p>
              )}
              <button type="submit" disabled={isWorking}>
                {isWorking ? "Creating account..." : "Create first admin account"}
              </button>
            </form>
          ) : (
            <form onSubmit={signIn} className="admin-form">
              <label>
                Email
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={login.email}
                  onChange={(event) =>
                    setLogin({ ...login, email: event.target.value })
                  }
                />
              </label>
              <label>
                Password
                <span className="password-field">
                  <input
                    type={showPasswords ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={login.password}
                    onChange={(event) =>
                      setLogin({ ...login, password: event.target.value })
                    }
                  />
                  <PasswordToggle
                    visible={showPasswords}
                    onToggle={() => setShowPasswords((visible) => !visible)}
                    label="password"
                  />
                </span>
              </label>
              <button type="submit" disabled={isWorking}>
                {isWorking ? "Signing in..." : "Sign in"}
              </button>
            </form>
          )}
        </section>
        <Link to="/" className="admin-back-link admin-login-back-link">
          ← Back to website
        </Link>
      </main>
    );
  }

  return (
    <main className="admin-shell admin-layout">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">S</span>
          <div>
            <strong>SerDave</strong>
            <small>Naturelle</small>
          </div>
        </div>
        <p className="admin-sidebar-label">Workspace</p>
        <nav className="admin-nav">
          {adminSections.map((section) => (
            <button
              type="button"
              key={section.id}
              className={activeSection === section.id ? "active" : ""}
              aria-current={activeSection === section.id ? "page" : undefined}
              onClick={() => {
                setActiveSection(section.id);
                setErrorMessage("");
                setNotice("");
              }}
            >
              <span aria-hidden="true" className={`admin-nav-icon icon-${section.id}`} />
              {section.label}
            </button>
          ))}
        </nav>
        <Link to="/" className="admin-back-link">
          ← Back to website
        </Link>
        <button
          type="button"
          className="secondary-button admin-sidebar-signout"
          onClick={signOut}
          disabled={isWorking}
        >
          Sign out
        </button>
      </aside>
      <div className="admin-content">
      <header className="admin-topbar">
        <div>
          <p className="admin-eyebrow">Management / {adminSections.find((section) => section.id === activeSection)?.label}</p>
          <h1>{adminSections.find((section) => section.id === activeSection)?.label}</h1>
          <p>Signed in as {admin.email}</p>
        </div>
      </header>

      {errorMessage && <p className="admin-message error" role="alert">{errorMessage}</p>}
      {notice && <p className="admin-message success" role="status">{notice}</p>}
      {!dashboard ? (
        <section className="admin-panel">
          <p role={errorMessage ? "alert" : "status"}>
            {errorMessage || "Loading management data..."}
          </p>
          {errorMessage && (
            <button type="button" onClick={() => runAdminAction(loadDashboard, "Dashboard refreshed.")} disabled={isWorking}>
              Retry loading dashboard
            </button>
          )}
        </section>
      ) : (
        <>
          {activeSection === "employees" && <section className="admin-panel">
            <h2>Employee accounts</h2>
            <p>
              Create an employee account and share its initial password securely.
              Employee accounts do not have access to this admin dashboard.
            </p>
            <form onSubmit={createEmployee} className="admin-form">
              <div className="admin-form-grid">
                <label>
                  Employee email
                  <input
                    type="email"
                    autoComplete="off"
                    required
                    maxLength="255"
                    value={employeeForm.email}
                    onChange={(event) =>
                      setEmployeeForm({ ...employeeForm, email: event.target.value })
                    }
                  />
                </label>
                <label>
                  Initial password (at least 12 characters)
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength="12"
                    maxLength="1024"
                    value={employeeForm.password}
                    onChange={(event) =>
                      setEmployeeForm({ ...employeeForm, password: event.target.value })
                    }
                  />
                </label>
                <label>
                  Confirm initial password
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength="12"
                    maxLength="1024"
                    value={employeeForm.confirmPassword}
                    onChange={(event) =>
                      setEmployeeForm({
                        ...employeeForm,
                        confirmPassword: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <button type="submit" disabled={isWorking}>
                {isWorking ? "Creating account..." : "Create employee account"}
              </button>
            </form>
            {dashboard.employees.length ? (
              <ul className="admin-list">
                {dashboard.employees.map((employee) => (
                  <li key={employee.id}>
                    <span>{employee.email}</span>
                    <small>
                      Created {new Date(employee.createdAt).toLocaleDateString()}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No employee accounts yet.</p>
            )}
          </section>}

          {activeSection === "appointments" && <section className="admin-panel">
            <h2>Appointments</h2>
            {dashboard.appointments.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date and time</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Add-ons</th>
                      <th>Status</th>
                      <th>Price / deposit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{appointment.appointmentDatetime}</td>
                        <td>
                          {appointment.customerName}
                          <small>{appointment.customerEmail}<br />{appointment.customerPhone}</small>
                        </td>
                        <td>{appointment.serviceName}</td>
                        <td>
                          {appointment.addOns.length
                            ? appointment.addOns.map((addOn) => addOn.serviceName).join(", ")
                            : "—"}
                        </td>
                        <td>{appointment.status.replaceAll("_", " ")}</td>
                        <td>GH₵{appointment.price} / GH₵{appointment.depositAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No appointments have been booked yet.</p>
            )}
          </section>}

          {activeSection === "categories" && <section className="admin-panel">
            <h2>Categories</h2>
            <form onSubmit={saveCategory} className="admin-inline-form">
              <label>
                {categoryForm.id ? "Edit category" : "New category"}
                <input
                  required
                  maxLength="100"
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm({ ...categoryForm, name: event.target.value })
                  }
                />
              </label>
              <button disabled={isWorking}>
                {categoryForm.id ? "Save category" : "Add category"}
              </button>
              {categoryForm.id && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setCategoryForm({ id: null, name: "" })}
                >
                  Cancel
                </button>
              )}
            </form>
            <ul className="admin-list">
              {dashboard.categories.map((category) => (
                <li key={category.id}>
                  <span>{category.name}</span>
                  <div>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setCategoryForm(category)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => removeCategory(category)}
                      disabled={isWorking}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>}

          {activeSection === "services" && <section className="admin-panel">
            <h2>Services</h2>
            <form onSubmit={saveService} className="admin-form admin-service-form">
              <h3>{serviceForm.id ? "Edit service" : "Add a service"}</h3>
              <div className="admin-form-grid">
                <label>
                  Service name
                  <input
                    required
                    maxLength="150"
                    value={serviceForm.serviceName}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, serviceName: event.target.value })
                    }
                  />
                </label>
                <label>
                  Category
                  <select
                    required
                    value={serviceForm.categoryId}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, categoryId: event.target.value })
                    }
                  >
                    <option value="">Choose a category</option>
                    {dashboard.categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Price (GHS)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={serviceForm.price}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, price: event.target.value })
                    }
                  />
                </label>
                <label>
                  Deposit (GHS)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={serviceForm.depositAmount}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, depositAmount: event.target.value })
                    }
                  />
                </label>
                <label>
                  Duration (minutes)
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={serviceForm.durationMinutes}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, durationMinutes: event.target.value })
                    }
                  />
                </label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={serviceForm.active}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, active: event.target.checked })
                    }
                  />
                  Active on public services page
                </label>
              </div>
              <label>
                Description
                <textarea
                  rows="3"
                  maxLength="5000"
                  value={serviceForm.description}
                  onChange={(event) =>
                    setServiceForm({ ...serviceForm, description: event.target.value })
                  }
                />
              </label>
              <div className="admin-actions">
                <button disabled={isWorking || !dashboard.categories.length}>
                  {serviceForm.id ? "Save service" : "Add service"}
                </button>
                {serviceForm.id && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setServiceForm({ id: null, ...emptyService })}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Service</th><th>Category</th><th>Price</th><th>Visibility</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {dashboard.services.map((service) => (
                    <tr key={service.id}>
                      <td>{service.serviceName}<small>{service.description}</small></td>
                      <td>{dashboard.categories.find((category) => category.id === service.categoryId)?.name || "—"}</td>
                      <td>GH₵{service.price}</td>
                      <td>{service.active ? "Active" : "Hidden"}</td>
                      <td className="admin-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            setServiceForm({
                              id: service.id,
                              serviceName: service.serviceName,
                              description: service.description || "",
                              price: service.price,
                              depositAmount: service.depositAmount,
                              durationMinutes: service.durationMinutes,
                              categoryId: service.categoryId,
                              active: service.active,
                            })
                          }
                        >
                          Edit
                        </button>
                        {service.active && (
                          <button
                            type="button"
                            className="danger-button"
                            disabled={isWorking}
                            onClick={() => removeService(service)}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>}

          {activeSection === "portfolio" && <section className="admin-panel">
            <h2>Home page portfolio</h2>
            <form onSubmit={savePortfolioItem} className="admin-form">
              <div className="admin-form-grid">
                <label>
                  Image title
                  <input
                    required
                    maxLength="100"
                    value={portfolioForm.title}
                    onChange={(event) =>
                      setPortfolioForm({ ...portfolioForm, title: event.target.value })
                    }
                  />
                </label>
                <label>
                  Related service (optional)
                  <select
                    value={portfolioForm.serviceId}
                    onChange={(event) =>
                      setPortfolioForm({ ...portfolioForm, serviceId: event.target.value })
                    }
                  >
                    <option value="">None</option>
                    {dashboard.services.map((service) => (
                      <option key={service.id} value={service.id}>{service.serviceName}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Description
                <textarea
                  rows="2"
                  maxLength="5000"
                  value={portfolioForm.description}
                  onChange={(event) =>
                    setPortfolioForm({ ...portfolioForm, description: event.target.value })
                  }
                />
              </label>
              <label>
                Image (JPEG, PNG, or WebP; up to 5 MB)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  onChange={(event) =>
                    setPortfolioForm({
                      ...portfolioForm,
                      image: event.target.files?.[0] || null,
                    })
                  }
                />
              </label>
              <button disabled={isWorking}>
                {isWorking ? "Uploading..." : "Upload to portfolio"}
              </button>
            </form>
            <div className="admin-portfolio-grid">
              {dashboard.portfolio.map((item) => (
                <article key={item.id}>
                  <img src={item.imageUrl} alt={item.title} />
                  <h3>{item.title}</h3>
                  {item.description && <p>{item.description}</p>}
                </article>
              ))}
            </div>
          </section>}
        </>
      )}
      </div>
    </main>
  );
}

export default AdminPage;
