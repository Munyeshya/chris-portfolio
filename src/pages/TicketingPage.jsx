import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendarDays,
  FaCheck,
  FaLocationDot,
} from "react-icons/fa6";
import { api, authApi } from "../lib/api.js";
import "./PortalPages.css";

const emptyEvent = {
  title: "",
  description: "",
  venue: "",
  startsAt: "",
  endsAt: "",
  capacity: "",
  registrationDeadline: "",
  publish: true,
  registrationFields: [],
};

export default function TicketingPage() {
  const [events, setEvents] = useState([]),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null),
    [ticket, setTicket] = useState(null),
    [notice, setNotice] = useState(""),
    [user, setUser] = useState(undefined),
    [organizer, setOrganizer] = useState(null),
    [myEvents, setMyEvents] = useState([]);
  const loadPublic = () =>
    api("/ticketing/events")
      .then((d) => setEvents(d.events))
      .catch((e) => setNotice(e.message));
  useEffect(() => {
    loadPublic();
    authApi
      .session()
      .then(({ user: u }) => {
        setUser(u);
        if (u)
          api("/ticketing/organizer").then((d) => setOrganizer(d.organizer));
      })
      .catch(() => setUser(null));
  }, []);
  useEffect(() => {
    if (organizer?.status === "approved")
      api("/ticketing/organizer/events")
        .then((d) => setMyEvents(d.events))
        .catch((e) => setNotice(e.message));
  }, [organizer]);
  const filteredEvents = events.filter((event) =>
    `${event.title} ${event.venue} ${event.organization_name} ${event.description || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  return (
    <div className="portal-page ticketing-page">
      <header className="portal-header">
        <Link to="/" className="portal-brand">
          <img src="/brand/lions-plus-white.png" alt="Lions Plus" />
        </Link>
        <nav>
          <a href="#events">Events</a>
          <a href="#organizer">Organizer portal</a>
          <Link className="portal-login" to="/login">
            Login
          </Link>
        </nav>
      </header>
      {notice && (
        <div className="booking-toast error">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
      <main>
        <section className="ticketing-hero portal-shell">
          <p className="portal-eyebrow">Lions Plus Ticketing</p>
          <h1>
            Register. Arrive.
            <br />
            <span>Enter smoothly.</span>
          </h1>
          <p>
            Discover events, reserve your place and receive a secure QR ticket
            for entrance.
          </p>
          <a className="portal-button primary" href="#events">
            Explore events <FaArrowRight />
          </a>
        </section>
        <section className="portal-section portal-shell" id="events">
          <div className="portal-heading">
            <p className="portal-eyebrow">Upcoming events</p>
            <h2>Choose your event</h2>
          </div>
          <label className="event-search">
            <span>Search events</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by event, venue or organizer"
            />
          </label>
          <div className="ticket-event-grid">
            {filteredEvents.length ? (
              filteredEvents.map((e) => (
                <article key={e.id}>
                  <div className="ticket-event-date">
                    <FaCalendarDays />
                    <span>{new Date(e.starts_at).toLocaleDateString()}</span>
                  </div>
                  <h3>{e.title}</h3>
                  <p>
                    <FaLocationDot /> {e.venue}
                  </p>
                  <small>Hosted by {e.organization_name}</small>
                  <div className="capacity">
                    <span>{e.registered} registered</span>
                    <strong>
                      {Math.max(0, e.capacity - e.registered)} places left
                    </strong>
                  </div>
                  <button
                    className="portal-button primary"
                    disabled={e.registered >= e.capacity}
                    onClick={() => setSelected(e)}
                  >
                    {e.registered >= e.capacity ? "Event full" : "Register"}{" "}
                    <FaArrowRight />
                  </button>
                </article>
              ))
            ) : (
              <p className="ticket-empty">
                {search.trim()
                  ? "No events match your search."
                  : "No public events are available yet."}
              </p>
            )}
          </div>
        </section>
        <section className="portal-section process-section" id="organizer">
          <div className="portal-shell booking-section-content">
            <div className="portal-heading">
              <p className="portal-eyebrow">Organizer portal</p>
              <h2>Manage registrations and entrance</h2>
            </div>
            {user === undefined ? (
              <p>Checking your account…</p>
            ) : !user ? (
              <p>
                Sign in with an account created by Lions Plus to
                request organizer access. <Link to="/login">Log in</Link>
              </p>
            ) : !organizer ? (
              <OrganizerApplication
                onDone={() =>
                  api("/ticketing/organizer").then((d) =>
                    setOrganizer(d.organizer),
                  )
                }
                setNotice={setNotice}
              />
            ) : organizer.status !== "approved" ? (
              <div className="organizer-status">
                <strong>Application {organizer.status}</strong>
                <p>
                  An administrator must approve your organizer account before
                  you can create events.
                </p>
              </div>
            ) : (
              <OrganizerWorkspace
                events={myEvents}
                reload={() =>
                  api("/ticketing/organizer/events").then((d) =>
                    setMyEvents(d.events),
                  )
                }
                setNotice={setNotice}
              />
            )}
          </div>
        </section>
      </main>
      <footer className="portal-footer portal-shell">
        <span>© 2026 Lions Plus</span>
        <Link to="/">
          <FaArrowLeft /> Main website
        </Link>
      </footer>
      {selected && (
        <RegistrationModal
          event={selected}
          close={() => setSelected(null)}
          success={(v) => {
            setTicket(v);
            setSelected(null);
            loadPublic();
          }}
          setNotice={setNotice}
        />
      )}{" "}
      {ticket && <TicketModal ticket={ticket} close={() => setTicket(null)} />}
    </div>
  );
}

function OrganizerApplication({ onDone, setNotice }) {
  const [f, setF] = useState({ organizationName: "", phone: "", reason: "" });
  async function submit(e) {
    e.preventDefault();
    try {
      await api("/ticketing/organizer/apply", {
        method: "POST",
        body: JSON.stringify(f),
      });
      setNotice("Organizer application submitted for approval.");
      onDone();
    } catch (x) {
      setNotice(x.message);
    }
  }
  return (
    <form className="ticket-form light" onSubmit={submit}>
      <label>
        Organization or client name
        <input
          required
          value={f.organizationName}
          onChange={(e) => setF({ ...f, organizationName: e.target.value })}
        />
      </label>
      <label>
        Phone
        <input
          value={f.phone}
          onChange={(e) => setF({ ...f, phone: e.target.value })}
        />
      </label>
      <label>
        Why do you need Ticketing?
        <textarea
          rows="4"
          value={f.reason}
          onChange={(e) => setF({ ...f, reason: e.target.value })}
        />
      </label>
      <button className="portal-button primary">
        Request organizer access
      </button>
    </form>
  );
}

function OrganizerWorkspace({ events, reload, setNotice }) {
  const [f, setF] = useState(emptyEvent),
    [manage, setManage] = useState(null);
  async function create(e) {
    e.preventDefault();
    try {
      await api("/ticketing/organizer/events", {
        method: "POST",
        body: JSON.stringify(f),
      });
      setNotice("Event created.");
      setF(emptyEvent);
      reload();
    } catch (x) {
      setNotice(x.message);
    }
  }
  return (
    <div className="organizer-workspace">
      <form className="ticket-form light" onSubmit={create}>
        <h3>Create an event</h3>
        <label>
          Event title
          <input
            required
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
          />
        </label>
        <label>
          Venue
          <input
            required
            value={f.venue}
            onChange={(e) => setF({ ...f, venue: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Starts
            <input
              required
              type="datetime-local"
              value={f.startsAt}
              onChange={(e) => setF({ ...f, startsAt: e.target.value })}
            />
          </label>
          <label>
            Ends
            <input
              type="datetime-local"
              value={f.endsAt}
              onChange={(e) => setF({ ...f, endsAt: e.target.value })}
            />
          </label>
        </div>
        <label>
          Venue capacity
          <input
            required
            min="1"
            type="number"
            value={f.capacity}
            onChange={(e) => setF({ ...f, capacity: e.target.value })}
          />
        </label>
        <label>
          Registration deadline
          <input
            type="datetime-local"
            value={f.registrationDeadline}
            onChange={(e) =>
              setF({ ...f, registrationDeadline: e.target.value })
            }
          />
        </label>
        <label>
          Description
          <textarea
            rows="4"
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
        </label>
        <FieldBuilder
          fields={f.registrationFields}
          setFields={(registrationFields) => setF({ ...f, registrationFields })}
        />
        <label className="ticket-check">
          <input
            type="checkbox"
            checked={f.publish}
            onChange={(e) => setF({ ...f, publish: e.target.checked })}
          />{" "}
          Publish immediately
        </label>
        <button className="portal-button primary">Create event</button>
      </form>
      <div className="organizer-events">
        <h3>My events</h3>
        {events.map((e) => (
          <button key={e.id} onClick={() => setManage(e)}>
            <strong>{e.title}</strong>
            <span>
              {e.registered}/{e.capacity} registered · {e.status}
            </span>
          </button>
        ))}
      </div>
      {manage && (
        <GuestManager
          event={manage}
          close={() => setManage(null)}
          setNotice={setNotice}
        />
      )}
    </div>
  );
}

function FieldBuilder({ fields, setFields }) {
  const update = (i, p) =>
    setFields(fields.map((f, x) => (x === i ? { ...f, ...p } : f)));
  return (
    <fieldset className="custom-fields">
      <legend>Registration fields</legend>
      <p>
        Name, email and phone are already included. Add any other information
        you need.
      </p>
      {fields.map((f, i) => (
        <div className="custom-field-row" key={f.id}>
          <input
            required
            placeholder="Field label"
            value={f.label}
            onChange={(e) => update(i, { label: e.target.value })}
          />
          <select
            value={f.type}
            onChange={(e) => update(i, { type: e.target.value })}
          >
            {[
              ["text", "Short text"],
              ["textarea", "Long text"],
              ["email", "Email"],
              ["tel", "Phone"],
              ["number", "Number"],
              ["date", "Date"],
              ["select", "Multiple choice"],
              ["checkbox", "Checkbox"],
            ].map(([v, l]) => (
              <option value={v} key={v}>
                {l}
              </option>
            ))}
          </select>
          {f.type === "select" && (
            <input
              required
              placeholder="Options separated by commas"
              value={f.options.join(", ")}
              onChange={(e) =>
                update(i, {
                  options: e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                })
              }
            />
          )}
          <label className="ticket-check">
            <input
              type="checkbox"
              checked={f.required}
              onChange={(e) => update(i, { required: e.target.checked })}
            />{" "}
            Required
          </label>
          <button
            type="button"
            onClick={() => setFields(fields.filter((_, x) => x !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="field-add"
        onClick={() =>
          setFields([
            ...fields,
            {
              id: `field_${Date.now()}`,
              label: "",
              type: "text",
              required: false,
              options: [],
            },
          ])
        }
      >
        + Add registration field
      </button>
    </fieldset>
  );
}

function RegistrationModal({ event, close, success, setNotice }) {
  const [f, setF] = useState({
      fullName: "",
      email: "",
      phone: "",
      registrationData: {},
    }),
    answer = (id, value) =>
      setF({ ...f, registrationData: { ...f.registrationData, [id]: value } });
  async function submit(e) {
    e.preventDefault();
    try {
      success(
        (
          await api(`/ticketing/events/${event.id}/register`, {
            method: "POST",
            body: JSON.stringify(f),
          })
        ).ticket,
      );
    } catch (x) {
      setNotice(x.message);
    }
  }
  return (
    <div className="ticket-modal">
      <form className="ticket-form" onSubmit={submit}>
        <button type="button" className="ticket-close" onClick={close}>
          ×
        </button>
        <p className="portal-eyebrow">Event registration</p>
        <h2>{event.title}</h2>
        <label>
          Full name
          <input
            required
            value={f.fullName}
            onChange={(e) => setF({ ...f, fullName: e.target.value })}
          />
        </label>
        <label>
          Email
          <input
            required
            type="email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </label>
        <label>
          Phone
          <input
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
        </label>
        {(event.registration_fields || []).map((field) => (
          <DynamicField
            key={field.id}
            field={field}
            value={f.registrationData[field.id]}
            setValue={(v) => answer(field.id, v)}
          />
        ))}
        <button className="portal-button primary">Confirm registration</button>
      </form>
    </div>
  );
}

function DynamicField({ field, value, setValue }) {
  if (field.type === "textarea")
    return (
      <label>
        {field.label}
        <textarea
          required={field.required}
          rows="3"
          value={value || ""}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
    );
  if (field.type === "select")
    return (
      <label>
        {field.label}
        <select
          required={field.required}
          value={value || ""}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">Select an option</option>
          {field.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
    );
  if (field.type === "checkbox")
    return (
      <label className="ticket-check">
        <input
          required={field.required}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => setValue(e.target.checked)}
        />
        {field.label}
      </label>
    );
  return (
    <label>
      {field.label}
      <input
        required={field.required}
        type={field.type}
        value={value || ""}
        onChange={(e) => setValue(e.target.value)}
      />
    </label>
  );
}

function TicketModal({ ticket, close }) {
  const ticketUrl = `${window.location.origin}/ticket/${ticket.qrToken}`,
    qrRef = useRef(null);
  function download() {
    const canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d"),
      qr = qrRef.current?.querySelector("canvas");
    canvas.width = 1200;
    canvas.height = 1600;
    ctx.fillStyle = "#0c0c0c";
    ctx.fillRect(0, 0, 1200, 1600);
    ctx.fillStyle = "#d62727";
    ctx.fillRect(0, 0, 1200, 34);
    ctx.fillStyle = "#fff";
    ctx.font = "700 42px Montserrat, Arial";
    ctx.fillText("LIONS PLUS", 90, 120);
    ctx.fillStyle = "#d62727";
    ctx.font = "700 26px Montserrat, Arial";
    ctx.fillText("DIGITAL EVENT TICKET", 90, 195);
    ctx.fillStyle = "#fff";
    ctx.font = "700 76px Montserrat, Arial";
    drawTicketText(ctx, ticket.eventTitle, 90, 320, 1020, 88);
    ctx.fillStyle = "#999";
    ctx.font = "600 25px Montserrat, Arial";
    ctx.fillText("GUEST", 90, 600);
    ctx.fillStyle = "#fff";
    ctx.font = "700 48px Montserrat, Arial";
    ctx.fillText(ticket.fullName, 90, 665);
    ctx.fillStyle = "#999";
    ctx.font = "600 25px Montserrat, Arial";
    ctx.fillText("TICKET NUMBER", 90, 755);
    ctx.fillStyle = "#fff";
    ctx.font = "700 38px monospace";
    ctx.fillText(ticket.ticketCode, 90, 815);
    if (qr) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(345, 900, 510, 510);
      ctx.drawImage(qr, 375, 930, 450, 450);
    }
    ctx.fillStyle = "#aaa";
    ctx.font = "500 25px Montserrat, Arial";
    ctx.textAlign = "center";
    ctx.fillText("Scan to verify this ticket at the entrance", 600, 1485);
    ctx.textAlign = "left";
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${ticket.ticketCode}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    }, "image/png");
  }
  return (
    <div className="ticket-modal">
      <div className="issued-ticket">
        <button className="ticket-close" onClick={close}>
          ×
        </button>
        <FaCheck className="ticket-success" />
        <p className="portal-eyebrow">Registration confirmed</p>
        <h2>{ticket.eventTitle}</h2>
        <QRCodeSVG value={ticketUrl} size={190} level="H" />
        <span className="ticket-qr-source" ref={qrRef}>
          <QRCodeCanvas value={ticketUrl} size={450} level="H" />
        </span>
        <strong>{ticket.fullName}</strong>
        <span>{ticket.ticketCode}</span>
        <p>
          Present this QR code or your name at the entrance. Scanning it opens
          your verified ticket details.
        </p>
        <button className="portal-button primary" onClick={download}>
          Download ticket PNG
        </button>
        <a href={ticketUrl}>Open digital ticket</a>
      </div>
    </div>
  );
}

function drawTicketText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "",
    lineNumber = 0;
  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y + lineNumber * lineHeight);
      line = `${word} `;
      lineNumber += 1;
    } else line = test;
  }
  ctx.fillText(line.trim(), x, y + lineNumber * lineHeight);
}

function GuestManager({ event, close, setNotice }) {
  const [people, setPeople] = useState([]),
    [search, setSearch] = useState(""),
    load = () =>
      api(`/ticketing/organizer/events/${event.id}/attendees`)
        .then((d) => setPeople(d.attendees))
        .catch((e) => setNotice(e.message));
  useEffect(() => {
    let active = true;
    api(`/ticketing/organizer/events/${event.id}/attendees`)
      .then((d) => {
        if (active) setPeople(d.attendees);
      })
      .catch((e) => setNotice(e.message));
    return () => {
      active = false;
    };
  }, [event.id, setNotice]);
  async function checkIn(e) {
    e.preventDefault();
    let query = search.trim();
    if (query.startsWith("LIONS:")) query = query.slice(6);
    else if (query.includes("/ticket/"))
      query = query.split("/ticket/").pop().split(/[?#]/)[0];
    try {
      const d = await api(`/ticketing/organizer/events/${event.id}/check-in`, {
        method: "POST",
        body: JSON.stringify({ query }),
      });
      setNotice(`${d.guest.full_name} checked in successfully.`);
      setSearch("");
      load();
    } catch (x) {
      setNotice(x.message);
    }
  }
  return (
    <div className="ticket-modal">
      <div className="guest-manager">
        <button className="ticket-close" onClick={close}>
          ×
        </button>
        <h2>{event.title}</h2>
        <form onSubmit={checkIn}>
          <input
            required
            placeholder="Guest name, ticket code or scanned ticket URL"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="portal-button primary">Check in</button>
        </form>
        <p>
          {people.filter((a) => a.status === "checked_in").length} entered ·{" "}
          {people.length} registered
        </p>
        <div className="guest-list">
          {people.map((a) => (
            <div key={a.id}>
              <strong>{a.full_name}</strong>
              <span>{a.ticket_code}</span>
              <small>{a.status.replace("_", " ")}</small>
              {event.registration_fields?.length > 0 && (
                <dl>
                  {event.registration_fields.map((f) => (
                    <span key={f.id}>
                      <dt>{f.label}</dt>
                      <dd>{String(a.registration_data?.[f.id] ?? "—")}</dd>
                    </span>
                  ))}
                </dl>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
