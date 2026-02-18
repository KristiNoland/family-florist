// @ts-nocheck
import { useState, useEffect, useRef } from "react";

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────
function calcHours(timeIn, timeOut) {
  if (!timeIn || !timeOut) return 0;
  const [hIn, mIn] = timeIn.split(":").map(Number);
  const [hOut, mOut] = timeOut.split(":").map(Number);
  return Math.max(0, (hOut * 60 + mOut - hIn * 60 - mIn) / 60);
}

function getDriverRate(driver, event) {
  if (driver.role === "dispatcher") return event?.dispatcherRate || event?.ratePerHour || 15;
  return event?.ratePerHour || 15;
}

function calcDriverEventTotal(driver, eventId, event) {
  const evtData = driver.events?.[eventId];
  if (!evtData?.hours) return { totalHours: 0, totalFuel: 0, totalPay: 0 };
  let totalMin = 0;
  let totalFuel = 0;
  for (const dayId of Object.keys(evtData.hours)) {
    const h = evtData.hours[dayId];
    const hrs1 = calcHours(h.timeIn1, h.timeOut1);
    const hrs2 = calcHours(h.timeIn2, h.timeOut2);
    totalMin += (hrs1 + hrs2) * 60;
    totalFuel += Number(h.fuel) || 0;
  }
  const totalHours = totalMin / 60;
  const rate = getDriverRate(driver, event);
  const totalPay = totalHours * rate + totalFuel;
  return { totalHours: Math.round(totalHours * 100) / 100, totalFuel, totalPay: Math.round(totalPay * 100) / 100 };
}

function formatCurrency(n) { return "$" + n.toFixed(2); }
function formatHours(h) { return h.toFixed(2); }

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

// ─── ICONS ──────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>,
    drivers: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>,
    calendar: <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>,
    clock: <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>,
    money: <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>,
    file: <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>,
    print: <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>,
    check: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>,
    close: <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>,
    edit: <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>,
    link: <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>,
    add: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>,
    search: <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>,
    warning: <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>,
    flower: <path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM5.6 10.25c0 1.38 1.12 2.5 2.5 2.5.53 0 1.01-.16 1.42-.44l-.02.19c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5l-.02-.19c.4.28.89.44 1.42.44 1.38 0 2.5-1.12 2.5-2.5 0-1-.59-1.85-1.43-2.25.84-.4 1.43-1.25 1.43-2.25 0-1.38-1.12-2.5-2.5-2.5-.53 0-1.01.16-1.42.44l.02-.19C14.5 2.12 13.38 1 12 1S9.5 2.12 9.5 3.5l.02.19c-.4-.28-.89-.44-1.42-.44-1.38 0-2.5 1.12-2.5 2.5 0 1 .59 1.85 1.43 2.25-.84.4-1.43 1.25-1.43 2.25zM12 5.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5S9.5 9.38 9.5 8s1.12-2.5 2.5-2.5zM3 13c0 4.97 4.03 9 9 9 0-4.97-4.03-9-9-9z"/>,
    back: <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>,
    copy: <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>,
    signup: <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>,
    settings: <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>,
    delete: <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>,
    dispatch: <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>,
    logout: <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>,
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ flexShrink: 0 }}>
      {icons[name] || null}
    </svg>
  );
};

// ─── STYLES ─────────────────────────────────────────────────────
const COLORS = {
  forest: "#1a5c2e", forestLight: "#2d7a42", forestDark: "#0f3d1d",
  cream: "#faf8f3", warmWhite: "#fff9f0",
  gold: "#c4952a", goldLight: "#e8c96a",
  rose: "#c0392b", roseLight: "#e74c3c", rosePale: "#fdf0ef",
  text: "#2c2c2c", textMuted: "#6b6b6b",
  border: "#e2ddd5", borderLight: "#f0ebe3",
  bg: "#f5f2ec", white: "#ffffff",
  success: "#27ae60", warning: "#f39c12", danger: "#e74c3c",
  purple: "#7c3aed", purpleLight: "#ede9fe",
};

// ─── REUSABLE COMPONENTS ────────────────────────────────────────
function Card({ children, style = {}, title, action, padding = 24 }) {
  return (
    <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", ...style }}>
      {title && (
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${COLORS.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.text }}>{title}</h3>
          {action}
        </div>
      )}
      <div style={{ padding }}>{children}</div>
    </div>
  );
}

function Badge({ children, color = COLORS.forest, bg }) {
  return (
    <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, color, background: bg || `${color}18`, letterSpacing: "0.3px" }}>
      {children}
    </span>
  );
}

function Btn({ children, variant = "primary", onClick, style = {}, icon, small }) {
  const styles = {
    primary: { background: COLORS.forest, color: "#fff", border: "none" },
    secondary: { background: "transparent", color: COLORS.forest, border: `1.5px solid ${COLORS.forest}` },
    danger: { background: COLORS.danger, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: COLORS.textMuted, border: "none" },
  };
  return (
    <button onClick={onClick} style={{
      ...styles[variant], borderRadius: 8, padding: small ? "6px 12px" : "8px 16px",
      fontSize: small ? 12 : 13, fontWeight: 500, cursor: "pointer", display: "inline-flex",
      alignItems: "center", gap: 6, transition: "all 0.15s", ...style,
    }}>
      {icon && <Icon name={icon} size={small ? 14 : 16} />}{children}
    </button>
  );
}

function StatCard({ label, value, icon, color = COLORS.forest, sub }) {
  return (
    <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: "18px 20px", flex: 1, minWidth: 140 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500 }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", color }}><Icon name={icon} size={18} /></div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, fontFamily: "'Playfair Display', serif" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder = "", small, style = {} }) {
  return (
    <div style={{ marginBottom: small ? 10 : 16, ...style }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", padding: "8px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, background: COLORS.white }} />
    </div>
  );
}

function CheckboxField({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", marginBottom: 8 }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 16, height: 16 }} />
      {label}
    </label>
  );
}

// ─── DB HELPERS ──────────────────────────────────────────────────
function eventToDb(e) {
  return {
    name: e.name, holiday: e.holiday || "", year: e.year, status: e.status,
    rate_per_hour: e.ratePerHour, dispatcher_rate: e.dispatcherRate,
    drivers_needed: e.driversNeeded, check_date: e.checkDate || null,
    info_packet_url: e.infoPacketUrl || "", liability_waiver_url: e.liabilityWaiverUrl || "",
    signup_intro: e.signupIntro || "", days: e.days || [],
  };
}

function eventFromDb(e) {
  return {
    id: e.id, name: e.name, holiday: e.holiday, year: e.year, status: e.status,
    ratePerHour: Number(e.rate_per_hour), dispatcherRate: Number(e.dispatcher_rate),
    driversNeeded: e.drivers_needed, checkDate: e.check_date || "",
    infoPacketUrl: e.info_packet_url, liabilityWaiverUrl: e.liability_waiver_url,
    signupIntro: e.signup_intro, days: e.days || [],
  };
}

function driverToDb(d) {
  return {
    name: d.name, email: d.email || "", phone: d.phone || "", alt_phone: d.altPhone || "",
    is_returning: d.returning || false, has_dl: d.hasDL || false, has_insurance: d.hasInsurance || false,
    check_pref: d.checkPref || "pickup", mailing_address: d.mailingAddress || "",
    signed_liability: d.signedLiability || false, status: d.status || "active", role: d.role || "driver",
    notes: d.notes || "", rating: d.rating || 0,
    dl_file_url: d.dlFileUrl || "", insurance_file_url: d.insuranceFileUrl || "", waiver_file_url: d.waiverFileUrl || "",
  };
}

function driverFromDb(d, driverEventsData) {
  const events = {};
  (driverEventsData || []).filter(de => de.driver_id === d.id).forEach(de => {
    events[de.event_id] = {
      signupDate: de.signup_date || "", availability: de.availability || {},
      partialHours: de.partial_hours || {}, thursdayAvailable: de.thursday_available || false,
      scheduled: de.scheduled || {}, hours: de.hours || {},
      checkNumber: de.check_number || "", paid: de.paid || false,
    };
  });
  return {
    id: d.id, name: d.name, email: d.email, phone: d.phone, altPhone: d.alt_phone || "",
    returning: d.is_returning, hasDL: d.has_dl, hasInsurance: d.has_insurance,
    checkPref: d.check_pref, mailingAddress: d.mailing_address || "",
    signedLiability: d.signed_liability, status: d.status, role: d.role, events,
    notes: d.notes || "", rating: d.rating || 0,
    dlFileUrl: d.dl_file_url || "", insuranceFileUrl: d.insurance_file_url || "", waiverFileUrl: d.waiver_file_url || "",
  };
}

const SAMPLE_TEMPLATES = [
  { id: "tmpl-1", name: "Delivery Log Sheet", type: "PDF", description: "Driver delivery tracking sheet with signature lines", uploadDate: "2025-12-01" },
  { id: "tmpl-2", name: "Liability Waiver", type: "PDF", description: "Independent contractor liability agreement", uploadDate: "2025-12-01" },
  { id: "tmpl-3", name: "Driver Info Packet", type: "DOCX", description: "Welcome packet with instructions and map", uploadDate: "2026-01-15" },
];

// ─── MAIN APP COMPONENT ─────────────────────────────────────────
export default function FamilyFloristApp({ supabase, user }) {
  const [view, setView] = useState("dashboard");
  const [activeEvent, setActiveEvent] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showSignupPreview, setShowSignupPreview] = useState(false);
  const [printMode, setPrintMode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const event = events.find((e) => e.id === activeEvent);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  // ─── DATA FETCHING ────────────────────────────────────────
  useEffect(() => { fetchAllData(); }, []);

  async function fetchAllData() {
    setLoading(true);
    const { data: eventsData } = await supabase.from("events").select("*").order("created_at");
    const { data: driversData } = await supabase.from("drivers").select("*").order("name");
    const { data: driverEventsData } = await supabase.from("driver_events").select("*");

    const evts = (eventsData || []).map(eventFromDb);
    const drvs = (driversData || []).map(d => driverFromDb(d, driverEventsData || []));

    setEvents(evts);
    setDrivers(drvs);
    if (evts.length > 0 && !activeEvent) setActiveEvent(evts[0].id);
    setLoading(false);
  }

  // ─── EVENT CRUD ───────────────────────────────────────────
  async function saveEvent(eventId, updates) {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updates } : e));
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.holiday !== undefined) dbUpdates.holiday = updates.holiday;
    if (updates.year !== undefined) dbUpdates.year = updates.year;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.ratePerHour !== undefined) dbUpdates.rate_per_hour = updates.ratePerHour;
    if (updates.dispatcherRate !== undefined) dbUpdates.dispatcher_rate = updates.dispatcherRate;
    if (updates.driversNeeded !== undefined) dbUpdates.drivers_needed = updates.driversNeeded;
    if (updates.checkDate !== undefined) dbUpdates.check_date = updates.checkDate || null;
    if (updates.infoPacketUrl !== undefined) dbUpdates.info_packet_url = updates.infoPacketUrl;
    if (updates.liabilityWaiverUrl !== undefined) dbUpdates.liability_waiver_url = updates.liabilityWaiverUrl;
    if (updates.signupIntro !== undefined) dbUpdates.signup_intro = updates.signupIntro;
    if (updates.days !== undefined) dbUpdates.days = updates.days;
    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from("events").update(dbUpdates).eq("id", eventId);
    }
  }

  async function createEvent(newEvt) {
    const dbEvt = eventToDb(newEvt);
    const { data, error } = await supabase.from("events").insert(dbEvt).select().single();
    if (data) {
      const evt = eventFromDb(data);
      setEvents(prev => [...prev, evt]);
      setActiveEvent(evt.id);
      showToast("Event created!");
      return evt;
    }
    if (error) showToast("Error creating event");
    return null;
  }

  async function removeEvent(eventId) {
    if (events.length <= 1) return;
    await supabase.from("events").delete().eq("id", eventId);
    setEvents(prev => prev.filter(e => e.id !== eventId));
    if (activeEvent === eventId) setActiveEvent(events.find(e => e.id !== eventId)?.id);
    showToast("Event deleted");
  }

  // ─── DRIVER CRUD ──────────────────────────────────────────
  async function createDriver(driverData, eventId) {
    const dbDriver = driverToDb(driverData);
    const { data, error } = await supabase.from("drivers").insert(dbDriver).select().single();
    if (error || !data) { showToast("Error adding driver"); return; }

    // Create driver_event link
    const deData = {
      driver_id: data.id, event_id: eventId,
      signup_date: new Date().toISOString().split("T")[0],
      availability: driverData.availability || {},
      partial_hours: driverData.partialHours || {},
      scheduled: driverData.scheduled || {},
      hours: {}, check_number: "", paid: false,
    };
    await supabase.from("driver_events").insert(deData);
    await fetchAllData();
    showToast("Driver added!");
  }

  async function updateDriver(driverId, updates) {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, ...updates } : d));
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.altPhone !== undefined) dbUpdates.alt_phone = updates.altPhone;
    if (updates.returning !== undefined) dbUpdates.is_returning = updates.returning;
    if (updates.hasDL !== undefined) dbUpdates.has_dl = updates.hasDL;
    if (updates.hasInsurance !== undefined) dbUpdates.has_insurance = updates.hasInsurance;
    if (updates.checkPref !== undefined) dbUpdates.check_pref = updates.checkPref;
    if (updates.mailingAddress !== undefined) dbUpdates.mailing_address = updates.mailingAddress;
    if (updates.signedLiability !== undefined) dbUpdates.signed_liability = updates.signedLiability;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
    if (updates.dlFileUrl !== undefined) dbUpdates.dl_file_url = updates.dlFileUrl;
    if (updates.insuranceFileUrl !== undefined) dbUpdates.insurance_file_url = updates.insuranceFileUrl;
    if (updates.waiverFileUrl !== undefined) dbUpdates.waiver_file_url = updates.waiverFileUrl;
    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from("drivers").update(dbUpdates).eq("id", driverId);
    }
  }

  async function removeDriver(driverId) {
    await supabase.from("drivers").delete().eq("id", driverId);
    setDrivers(prev => prev.filter(d => d.id !== driverId));
    setSelectedDriver(null);
    showToast("Driver removed");
  }

  async function saveDriverEvent(driverId, eventId, field, value) {
    // Update local state
    setDrivers(prev => prev.map(d => {
      if (d.id !== driverId) return d;
      const updated = { ...d, events: { ...d.events } };
      updated.events[eventId] = { ...updated.events[eventId], [field]: value };
      return updated;
    }));
    // Save to DB
    const dbField = { signupDate: "signup_date", availability: "availability", partialHours: "partial_hours",
      thursdayAvailable: "thursday_available", scheduled: "scheduled", hours: "hours",
      checkNumber: "check_number", paid: "paid" }[field] || field;
    await supabase.from("driver_events").update({ [dbField]: value }).eq("driver_id", driverId).eq("event_id", eventId);
  }

  async function addDriverToEvent(driverId, eventId) {
    const deData = {
      driver_id: driverId, event_id: eventId,
      signup_date: new Date().toISOString().split("T")[0],
      availability: {}, partial_hours: {}, scheduled: {}, hours: {},
      check_number: "", paid: false,
    };
    await supabase.from("driver_events").upsert(deData, { onConflict: "driver_id,event_id" });
    await fetchAllData();
  }

  // ─── LOGOUT ───────────────────────────────────────────────
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "drivers", label: "Drivers", icon: "drivers" },
    { id: "schedule", label: "Schedule", icon: "calendar" },
    { id: "hours", label: "Hours & Pay", icon: "clock" },
    { id: "summary", label: "Pay Summary", icon: "money" },
    { id: "templates", label: "Templates", icon: "file" },
    { id: "signup", label: "Signup Form", icon: "signup" },
    { id: "event-settings", label: "Event Settings", icon: "settings" },
  ];

  if (printMode) return <PrintView mode={printMode} event={event} drivers={drivers} activeEvent={activeEvent} onClose={() => setPrintMode(null)} />;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.forest, fontFamily: "'Playfair Display', serif" }}>Loading...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Libre Franklin', 'Segoe UI', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header style={{
        background: `linear-gradient(135deg, ${COLORS.forestDark} 0%, ${COLORS.forest} 50%, ${COLORS.forestLight} 100%)`,
        padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Icon name="flower" size={22} />
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 600, color: "#fff", lineHeight: 1.1 }}>Family Florist</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: "0.5px", fontStyle: "italic" }}>Delivery Driver Management</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {events.length > 0 && (
            <select value={activeEvent} onChange={(e) => setActiveEvent(e.target.value)}
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 500, cursor: "pointer", outline: "none" }}>
              {events.map((e) => (<option key={e.id} value={e.id} style={{ color: "#333", background: "#fff" }}>{e.name}</option>))}
            </select>
          )}
          {event && <div style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: event.status === "active" ? COLORS.success : COLORS.gold, color: "#fff", textTransform: "uppercase" }}>{event.status}</div>}
          <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 10px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            <Icon name="logout" size={16} /> Sign Out
          </button>
        </div>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
        <nav style={{ width: 220, background: COLORS.white, borderRight: `1px solid ${COLORS.border}`, padding: "16px 0", flexShrink: 0 }}>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { setView(item.id); setSelectedDriver(null); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 20px", border: "none", cursor: "pointer", fontSize: 13.5,
                fontWeight: view === item.id ? 600 : 400, textAlign: "left", transition: "all 0.15s",
                background: view === item.id ? COLORS.rosePale : "transparent",
                color: view === item.id ? COLORS.rose : COLORS.text,
                borderRight: view === item.id ? `3px solid ${COLORS.rose}` : "3px solid transparent",
              }}>
              <Icon name={item.icon} size={18} />{item.label}
            </button>
          ))}
        </nav>

        <main style={{ flex: 1, padding: 28, maxWidth: 1100, overflowX: "auto" }}>
          {events.length === 0 && view !== "event-settings" ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌸</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 8 }}>Welcome to Family Florist</h2>
              <p style={{ color: COLORS.textMuted, marginBottom: 24 }}>Create your first event to get started.</p>
              <Btn icon="add" onClick={() => setView("event-settings")}>Create First Event</Btn>
            </div>
          ) : (
            <>
              {view === "dashboard" && <DashboardView event={event} drivers={drivers} activeEvent={activeEvent} setView={setView} />}
              {view === "drivers" && (
                selectedDriver
                  ? <DriverDetail driver={drivers.find(d => d.id === selectedDriver.id) || selectedDriver} event={event} activeEvent={activeEvent} drivers={drivers} updateDriver={updateDriver} removeDriver={removeDriver} saveDriverEvent={saveDriverEvent} onBack={() => setSelectedDriver(null)} showToast={showToast} supabase={supabase} />
                  : <DriversView drivers={drivers} event={event} activeEvent={activeEvent} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSelect={setSelectedDriver} updateDriver={updateDriver} createDriver={createDriver} addDriverToEvent={addDriverToEvent} showToast={showToast} />
              )}
              {view === "schedule" && <ScheduleView event={event} drivers={drivers} activeEvent={activeEvent} setPrintMode={setPrintMode} saveDriverEvent={saveDriverEvent} />}
              {view === "hours" && <HoursView event={event} drivers={drivers} activeEvent={activeEvent} saveDriverEvent={saveDriverEvent} />}
              {view === "summary" && <SummaryView event={event} drivers={drivers} activeEvent={activeEvent} setPrintMode={setPrintMode} saveDriverEvent={saveDriverEvent} />}
              {view === "templates" && <TemplatesView />}
              {view === "signup" && <SignupView event={event} events={events} saveEvent={saveEvent} activeEvent={activeEvent} showToast={showToast} showSignupPreview={showSignupPreview} setShowSignupPreview={setShowSignupPreview} />}
              {view === "event-settings" && <EventSettingsView events={events} createEvent={createEvent} saveEvent={saveEvent} removeEvent={removeEvent} activeEvent={activeEvent} setActiveEvent={setActiveEvent} showToast={showToast} />}
            </>
          )}
        </main>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: COLORS.forest, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", animation: "slideUp 0.3s ease", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="check" size={16} /> {toast}
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media print { header, nav { display: none !important; } main { padding: 0 !important; } }
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { outline: 2px solid ${COLORS.forest}; outline-offset: 1px; }
        button:hover { opacity: 0.92; }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EVENT SETTINGS VIEW
// ═══════════════════════════════════════════════════════════════
function EventSettingsView({ events, createEvent, saveEvent, removeEvent, activeEvent, setActiveEvent, showToast }) {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvt, setNewEvt] = useState({ name: "", holiday: "", year: new Date().getFullYear(), ratePerHour: 15, dispatcherRate: 20, driversNeeded: 15, checkDate: "" });
  const [addingDay, setAddingDay] = useState(null);
  const [newDay, setNewDay] = useState({ date: "", startTime: "7:30 AM", endTime: "5:00 PM" });
  const evt = events.find((e) => e.id === activeEvent);

  async function handleAddEvent() {
    if (!newEvt.name) return;
    await createEvent({ ...newEvt, status: "upcoming", days: [], infoPacketUrl: "", liabilityWaiverUrl: "", signupIntro: "Drivers will deliver flower arrangements on the dates listed below. Must have valid DL, insurance, and a vehicle." });
    setShowAddEvent(false);
    setNewEvt({ name: "", holiday: "", year: new Date().getFullYear(), ratePerHour: 15, dispatcherRate: 20, driversNeeded: 15, checkDate: "" });
  }

  async function addDay(eventId) {
    if (!newDay.date || !evt) return;
    const day = { id: "d-" + Date.now(), date: newDay.date, label: formatDateLabel(newDay.date), startTime: newDay.startTime, endTime: newDay.endTime };
    await saveEvent(eventId, { days: [...evt.days, day] });
    setAddingDay(null);
    setNewDay({ date: "", startTime: "7:30 AM", endTime: "5:00 PM" });
    showToast("Day added!");
  }

  async function removeDay(eventId, dayId) {
    if (!evt) return;
    await saveEvent(eventId, { days: evt.days.filter(d => d.id !== dayId) });
    showToast("Day removed");
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Event Settings</h2>
        <Btn icon="add" onClick={() => setShowAddEvent(true)}>New Event</Btn>
      </div>

      {showAddEvent && (
        <Card title="Create New Event" style={{ marginBottom: 24, border: `2px solid ${COLORS.forest}` }}
          action={<Btn small variant="ghost" icon="close" onClick={() => setShowAddEvent(false)} />}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <InputField label="Event Name" value={newEvt.name} onChange={(e) => setNewEvt(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Valentine's Day 2027" />
            <InputField label="Holiday" value={newEvt.holiday} onChange={(e) => setNewEvt(p => ({ ...p, holiday: e.target.value }))} placeholder="e.g. Valentine's Day" />
            <InputField label="Year" type="number" value={newEvt.year} onChange={(e) => setNewEvt(p => ({ ...p, year: Number(e.target.value) }))} />
            <InputField label="Drivers Needed Per Day" type="number" value={newEvt.driversNeeded} onChange={(e) => setNewEvt(p => ({ ...p, driversNeeded: Number(e.target.value) }))} />
            <InputField label="Driver Rate $/hr" type="number" value={newEvt.ratePerHour} onChange={(e) => setNewEvt(p => ({ ...p, ratePerHour: Number(e.target.value) }))} />
            <InputField label="Dispatcher Rate $/hr" type="number" value={newEvt.dispatcherRate} onChange={(e) => setNewEvt(p => ({ ...p, dispatcherRate: Number(e.target.value) }))} />
            <InputField label="Check Date" type="date" value={newEvt.checkDate} onChange={(e) => setNewEvt(p => ({ ...p, checkDate: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Btn onClick={handleAddEvent}>Create Event</Btn>
            <Btn variant="ghost" onClick={() => setShowAddEvent(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {evt && (
        <div style={{ display: "grid", gap: 20 }}>
          <Card title={`Pay Rates — ${evt.name}`} action={<Badge color={evt.status === "active" ? COLORS.success : COLORS.gold}>{evt.status}</Badge>}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Driver Rate ($/hr)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.forest }}>$</span>
                  <input type="number" min="0" step="0.50" value={evt.ratePerHour} onChange={(e) => saveEvent(evt.id, { ratePerHour: Number(e.target.value) })}
                    style={{ width: 80, padding: "10px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 18, fontWeight: 700, color: COLORS.forest }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Dispatcher Rate ($/hr)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.purple }}>$</span>
                  <input type="number" min="0" step="0.50" value={evt.dispatcherRate} onChange={(e) => saveEvent(evt.id, { dispatcherRate: Number(e.target.value) })}
                    style={{ width: 80, padding: "10px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 18, fontWeight: 700, color: COLORS.purple }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Drivers Needed / Day</label>
                <input type="number" min="1" value={evt.driversNeeded} onChange={(e) => saveEvent(evt.id, { driversNeeded: Number(e.target.value) })}
                  style={{ width: 80, padding: "10px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 18, fontWeight: 700 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              <InputField label="Check Date" type="date" value={evt.checkDate} onChange={(e) => saveEvent(evt.id, { checkDate: e.target.value })} small />
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Status</label>
                <select value={evt.status} onChange={(e) => saveEvent(evt.id, { status: e.target.value })}
                  style={{ padding: "8px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13 }}>
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </Card>

          <Card title={`Event Dates — ${evt.name}`} action={<Btn small icon="add" onClick={() => setAddingDay(evt.id)}>Add Day</Btn>}>
            {evt.days.length === 0 && <p style={{ fontSize: 13, color: COLORS.textMuted, fontStyle: "italic" }}>No days added yet.</p>}
            {evt.days.map((day, i) => (
              <div key={day.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: i % 2 === 0 ? COLORS.cream : "transparent", borderRadius: 8, marginBottom: 4 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{day.label}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>{day.date} · {day.startTime} – {day.endTime}</div>
                </div>
                <Btn small variant="ghost" icon="delete" onClick={() => removeDay(evt.id, day.id)} style={{ color: COLORS.danger }} />
              </div>
            ))}
            {addingDay === evt.id && (
              <div style={{ marginTop: 16, padding: 16, background: COLORS.cream, borderRadius: 8, border: `1px dashed ${COLORS.border}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <InputField label="Date" type="date" value={newDay.date} onChange={(e) => setNewDay(p => ({ ...p, date: e.target.value }))} small />
                  <InputField label="Start Time" value={newDay.startTime} onChange={(e) => setNewDay(p => ({ ...p, startTime: e.target.value }))} small />
                  <InputField label="End Time" value={newDay.endTime} onChange={(e) => setNewDay(p => ({ ...p, endTime: e.target.value }))} small />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn small onClick={() => addDay(evt.id)}>Add Day</Btn>
                  <Btn small variant="ghost" onClick={() => setAddingDay(null)}>Cancel</Btn>
                </div>
              </div>
            )}
          </Card>

          <Card title="Document Links for Signup Form">
            <InputField label="Driver Information Packet URL" value={evt.infoPacketUrl || ""} onChange={(e) => saveEvent(evt.id, { infoPacketUrl: e.target.value })} placeholder="https://drive.google.com/..." />
            <InputField label="Liability Waiver URL" value={evt.liabilityWaiverUrl || ""} onChange={(e) => saveEvent(evt.id, { liabilityWaiverUrl: e.target.value })} placeholder="https://drive.google.com/..." />
          </Card>

          <Card title="Danger Zone" style={{ borderColor: "#fecaca" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Delete this event</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>This cannot be undone.</div>
              </div>
              <Btn small variant="danger" icon="delete" onClick={() => removeEvent(evt.id)}>Delete Event</Btn>
            </div>
          </Card>
        </div>
      )}

      <Card title="All Events" style={{ marginTop: 24 }}>
        {events.map((e) => (
          <div key={e.id} onClick={() => setActiveEvent(e.id)}
            style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderRadius: 8, cursor: "pointer", background: e.id === activeEvent ? COLORS.rosePale : "transparent", marginBottom: 4 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>{e.days.length} day{e.days.length !== 1 ? "s" : ""} · Driver: {formatCurrency(e.ratePerHour)}/hr · Dispatcher: {formatCurrency(e.dispatcherRate || e.ratePerHour)}/hr</div>
            </div>
            <Badge color={e.status === "active" ? COLORS.success : e.status === "completed" ? COLORS.textMuted : COLORS.gold}>{e.status}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD VIEW
// ═══════════════════════════════════════════════════════════════
function DashboardView({ event, drivers, activeEvent, setView }) {
  if (!event) return null;
  const eventDrivers = drivers.filter((d) => d.events?.[activeEvent]);
  const dispatchers = eventDrivers.filter(d => d.role === "dispatcher");
  const scheduled = eventDrivers.filter((d) => { const s = d.events[activeEvent]?.scheduled; return s && Object.values(s).some(Boolean); });
  const missingDocs = eventDrivers.filter((d) => !d.hasDL || !d.hasInsurance);
  const totalPay = scheduled.reduce((sum, d) => sum + calcDriverEventTotal(d, activeEvent, event).totalPay, 0);
  const paidCount = scheduled.filter((d) => d.events[activeEvent]?.paid).length;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{event.name}</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>
          {event.days.map((d) => d.label).join("  •  ")} &nbsp;|&nbsp; Driver: {formatCurrency(event.ratePerHour)}/hr &nbsp;|&nbsp; Dispatcher: {formatCurrency(event.dispatcherRate || event.ratePerHour)}/hr
        </p>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Signups" value={eventDrivers.length} icon="signup" color={COLORS.forest} sub={`of ${event.driversNeeded} needed per day`} />
        <StatCard label="Dispatchers" value={dispatchers.length} icon="dispatch" color={COLORS.purple} sub="of 2 max" />
        <StatCard label="Total Payroll" value={formatCurrency(totalPay)} icon="money" color={COLORS.rose} sub={`${paidCount} of ${scheduled.length} paid`} />
        <StatCard label="Missing Docs" value={missingDocs.length} icon="warning" color={missingDocs.length > 0 ? COLORS.danger : COLORS.success} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card title="Daily Driver Count">
          {event.days.map((day) => {
            const count = eventDrivers.filter((d) => d.role !== "dispatcher" && d.events[activeEvent]?.scheduled?.[day.id]).length;
            const pct = Math.min(100, (count / event.driversNeeded) * 100);
            return (
              <div key={day.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 500 }}>{day.label}</span>
                  <span style={{ color: COLORS.textMuted }}>{count} / {event.driversNeeded}</span>
                </div>
                <div style={{ height: 8, background: COLORS.borderLight, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? COLORS.success : COLORS.gold, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </Card>
        <Card title="Quick Actions">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Btn icon="drivers" onClick={() => setView("drivers")}>Manage Drivers</Btn>
            <Btn icon="calendar" variant="secondary" onClick={() => setView("schedule")}>View Schedule</Btn>
            <Btn icon="clock" variant="secondary" onClick={() => setView("hours")}>Enter Hours</Btn>
            <Btn icon="settings" variant="secondary" onClick={() => setView("event-settings")}>Event Settings</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DRIVERS VIEW (with Add Driver form)
// ═══════════════════════════════════════════════════════════════
function DriversView({ drivers, event, activeEvent, searchTerm, setSearchTerm, onSelect, updateDriver, createDriver, addDriverToEvent, showToast }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showExisting, setShowExisting] = useState(false);
  const [newDrv, setNewDrv] = useState({ name: "", email: "", phone: "", altPhone: "", returning: false, hasDL: false, hasInsurance: false, signedLiability: false, checkPref: "pickup", mailingAddress: "", availability: {}, partialHours: {}, scheduled: {} });

  const eventDrivers = drivers.filter((d) => d.events?.[activeEvent]);
  const existingDrivers = drivers.filter((d) => !d.events?.[activeEvent]);
  const dispatcherCount = eventDrivers.filter(d => d.role === "dispatcher").length;
  const filtered = eventDrivers.filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.email.toLowerCase().includes(searchTerm.toLowerCase()));

  function toggleRole(driverId) {
    const d = drivers.find(x => x.id === driverId);
    if (!d) return;
    const otherDispatchers = drivers.filter(x => x.role === "dispatcher" && x.id !== driverId).length;
    if (d.role === "driver" && otherDispatchers >= 2) return;
    updateDriver(driverId, { role: d.role === "dispatcher" ? "driver" : "dispatcher" });
  }

  async function handleAddDriver() {
    if (!newDrv.name) { showToast("Name is required"); return; }
    // Build scheduled from availability
    const scheduled = {};
    if (event?.days) {
      event.days.forEach(day => {
        const avail = newDrv.availability[day.id];
        if (avail && avail !== "unavailable") scheduled[day.id] = true;
      });
    }
    await createDriver({ ...newDrv, scheduled }, activeEvent);
    setShowAdd(false);
    setNewDrv({ name: "", email: "", phone: "", altPhone: "", returning: false, hasDL: false, hasInsurance: false, signedLiability: false, checkPref: "pickup", mailingAddress: "", availability: {}, partialHours: {}, scheduled: {} });
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Drivers ({eventDrivers.length})</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.textMuted }}>Dispatchers: {dispatcherCount}/2</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "8px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, width: 180, background: COLORS.white }} />
          {existingDrivers.length > 0 && <Btn icon="drivers" variant="secondary" onClick={() => { setShowExisting(!showExisting); setShowAdd(false); }}>Add Existing ({existingDrivers.length})</Btn>}
          <Btn icon="add" onClick={() => { setShowAdd(true); setShowExisting(false); }}>New Driver</Btn>
        </div>
      </div>

      {showAdd && (
        <Card title="Add New Driver" style={{ marginBottom: 20, border: `2px solid ${COLORS.forest}` }}
          action={<Btn small variant="ghost" icon="close" onClick={() => setShowAdd(false)} />}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <InputField label="Full Name *" value={newDrv.name} onChange={(e) => setNewDrv(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" />
            <InputField label="Email" value={newDrv.email} onChange={(e) => setNewDrv(p => ({ ...p, email: e.target.value }))} placeholder="jane@email.com" />
            <InputField label="Cell Phone" value={newDrv.phone} onChange={(e) => setNewDrv(p => ({ ...p, phone: e.target.value }))} placeholder="(479) 555-1234" />
            <InputField label="Alt Phone" value={newDrv.altPhone} onChange={(e) => setNewDrv(p => ({ ...p, altPhone: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Check Preference</label>
              <select value={newDrv.checkPref} onChange={(e) => setNewDrv(p => ({ ...p, checkPref: e.target.value }))}
                style={{ padding: "8px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, width: "100%", marginBottom: 16 }}>
                <option value="pickup">Pickup</option>
                <option value="mail">Mail</option>
              </select>
            </div>
            {newDrv.checkPref === "mail" && (
              <InputField label="Mailing Address" value={newDrv.mailingAddress} onChange={(e) => setNewDrv(p => ({ ...p, mailingAddress: e.target.value }))} />
            )}
          </div>
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            <CheckboxField label="Returning Driver" checked={newDrv.returning} onChange={(e) => setNewDrv(p => ({ ...p, returning: e.target.checked }))} />
            <CheckboxField label="Driver's License" checked={newDrv.hasDL} onChange={(e) => setNewDrv(p => ({ ...p, hasDL: e.target.checked }))} />
            <CheckboxField label="Insurance" checked={newDrv.hasInsurance} onChange={(e) => setNewDrv(p => ({ ...p, hasInsurance: e.target.checked }))} />
            <CheckboxField label="Liability Waiver" checked={newDrv.signedLiability} onChange={(e) => setNewDrv(p => ({ ...p, signedLiability: e.target.checked }))} />
          </div>
          {event?.days && event.days.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, textTransform: "uppercase" }}>Availability</label>
              {event.days.map(day => (
                <div key={day.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, padding: "8px 12px", background: COLORS.cream, borderRadius: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 13, minWidth: 160 }}>{day.label}</span>
                  <select value={newDrv.availability[day.id] || "all_day"} onChange={(e) => setNewDrv(p => ({ ...p, availability: { ...p.availability, [day.id]: e.target.value } }))}
                    style={{ padding: "6px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13 }}>
                    <option value="all_day">All Day</option>
                    <option value="partial">Partial</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                  {newDrv.availability[day.id] === "partial" && (
                    <input type="text" placeholder="e.g. 8:30 AM - 3:00 PM" value={newDrv.partialHours[day.id] || ""}
                      onChange={(e) => setNewDrv(p => ({ ...p, partialHours: { ...p.partialHours, [day.id]: e.target.value } }))}
                      style={{ padding: "6px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, flex: 1 }} />
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={handleAddDriver}>Add Driver</Btn>
            <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {showExisting && existingDrivers.length > 0 && (
        <Card title="Add Existing Drivers to This Event" style={{ marginBottom: 20, border: `2px solid ${COLORS.gold}` }}
          action={<Btn small variant="ghost" icon="close" onClick={() => setShowExisting(false)} />}>
          <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>
            These drivers are already in your database from other events. Click to add them to <strong>{event?.name}</strong>.
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            {existingDrivers.map(d => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: COLORS.cream, borderRadius: 8, border: `1px solid ${COLORS.borderLight}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.forest}, ${COLORS.forestLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700 }}>{d.name.charAt(0)}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                      {d.phone}{d.email ? ` · ${d.email}` : ""}{d.rating ? ` · ${"★".repeat(d.rating)}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Badge color={d.hasDL ? COLORS.success : COLORS.danger}>{d.hasDL ? "DL ✓" : "DL ✗"}</Badge>
                    <Badge color={d.hasInsurance ? COLORS.success : COLORS.danger}>{d.hasInsurance ? "Ins ✓" : "Ins ✗"}</Badge>
                  </div>
                  <Btn small icon="add" onClick={async () => { await addDriverToEvent(d.id, activeEvent); showToast(`${d.name} added to event!`); }}>Add to Event</Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card padding={0}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ borderBottom: `2px solid ${COLORS.borderLight}` }}>
            {["Name", "Role", "Phone", "Documents", "Check Pref", ""].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: COLORS.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: COLORS.textMuted, fontStyle: "italic" }}>
                {eventDrivers.length === 0 ? 'No drivers yet. Click "Add Driver" to get started.' : "No matching drivers."}
              </td></tr>
            )}
            {filtered.map((d) => (
              <tr key={d.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}`, cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.background = COLORS.cream}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "12px 16px", fontWeight: 500 }} onClick={() => onSelect(d)}>
                  {d.name}{d.returning && <span style={{ marginLeft: 6, fontSize: 10, color: COLORS.success }}>returning</span>}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <button onClick={(e) => { e.stopPropagation(); toggleRole(d.id); }}
                    style={{ padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                      background: d.role === "dispatcher" ? COLORS.purpleLight : `${COLORS.forest}15`, color: d.role === "dispatcher" ? COLORS.purple : COLORS.forest }}>
                    {d.role === "dispatcher" ? "⚡ Dispatcher" : "🚗 Driver"}
                  </button>
                </td>
                <td style={{ padding: "12px 16px", color: COLORS.textMuted }} onClick={() => onSelect(d)}>{d.phone}</td>
                <td style={{ padding: "12px 16px" }} onClick={() => onSelect(d)}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Badge color={d.hasDL ? COLORS.success : COLORS.danger}>{d.hasDL ? "DL ✓" : "DL ✗"}</Badge>
                    <Badge color={d.hasInsurance ? COLORS.success : COLORS.danger}>{d.hasInsurance ? "Ins ✓" : "Ins ✗"}</Badge>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12 }} onClick={() => onSelect(d)}>{d.checkPref === "pickup" ? "Pickup" : "Mail"}</td>
                <td style={{ padding: "12px 16px" }}><Btn small variant="ghost" icon="edit" onClick={() => onSelect(d)}>View</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DRIVER DETAIL (with Edit & Delete)
// ═══════════════════════════════════════════════════════════════
function DriverDetail({ driver, event, activeEvent, drivers, updateDriver, removeDriver, saveDriverEvent, onBack, showToast, supabase }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...driver });
  const [notesText, setNotesText] = useState(driver.notes || "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [uploading, setUploading] = useState("");
  const evtData = driver.events?.[activeEvent];

  useEffect(() => { setNotesText(driver.notes || ""); }, [driver.notes]);
  const rate = getDriverRate(driver, event);
  const totals = calcDriverEventTotal(driver, activeEvent, event);

  function startEdit() { setForm({ ...driver }); setEditing(true); }
  async function saveEdit() {
    await updateDriver(driver.id, {
      name: form.name, email: form.email, phone: form.phone, altPhone: form.altPhone,
      returning: form.returning, hasDL: form.hasDL, hasInsurance: form.hasInsurance,
      checkPref: form.checkPref, mailingAddress: form.mailingAddress,
      signedLiability: form.signedLiability,
    });
    setEditing(false);
    showToast("Driver updated!");
  }

  async function saveNotes() {
    await updateDriver(driver.id, { notes: notesText });
    setEditingNotes(false);
    showToast("Notes saved!");
  }

  async function setRating(stars) {
    await updateDriver(driver.id, { rating: stars });
    showToast("Rating saved!");
  }

  async function handleFileUpload(e, docType) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(docType);
    const fileExt = file.name.split(".").pop();
    const fileName = `${driver.id}/${docType}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("driver-docs").upload(fileName, file, { upsert: true });
    if (uploadError) {
      showToast("Upload failed: " + uploadError.message);
      setUploading("");
      return;
    }
    const { data: urlData } = supabase.storage.from("driver-docs").getPublicUrl(fileName);
    const urlField = { dl: "dlFileUrl", insurance: "insuranceFileUrl", waiver: "waiverFileUrl" }[docType];
    const checkField = { dl: "hasDL", insurance: "hasInsurance", waiver: "signedLiability" }[docType];
    await updateDriver(driver.id, { [urlField]: urlData.publicUrl, [checkField]: true });
    setUploading("");
    showToast("Document uploaded!");
  }

  function StarRating({ current, onRate }) {
    return (
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} onClick={() => onRate(star)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: star <= current ? "#f59e0b" : "#d1d5db", transition: "color 0.15s" }}>
            ★
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <Btn variant="ghost" icon="back" onClick={onBack} style={{ marginBottom: 16 }}>Back to Drivers</Btn>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: driver.role === "dispatcher" ? `linear-gradient(135deg, ${COLORS.purple}, #a78bfa)` : `linear-gradient(135deg, ${COLORS.forest}, ${COLORS.forestLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{driver.name.charAt(0)}</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{driver.name}</h2>
            <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>
              <Badge color={driver.role === "dispatcher" ? COLORS.purple : COLORS.forest}>{driver.role === "dispatcher" ? "Dispatcher" : "Driver"}</Badge>
              {" · "}{driver.returning ? "Returning" : "New"} · Rate: {formatCurrency(rate)}/hr
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!editing && <Btn small icon="edit" variant="secondary" onClick={startEdit}>Edit</Btn>}
          {editing && <Btn small icon="check" onClick={saveEdit}>Save</Btn>}
          {editing && <Btn small variant="ghost" onClick={() => setEditing(false)}>Cancel</Btn>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card title="Contact Information">
          {editing ? (
            <div>
              <InputField label="Name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} small />
              <InputField label="Email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} small />
              <InputField label="Phone" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} small />
              <InputField label="Alt Phone" value={form.altPhone} onChange={(e) => setForm(p => ({ ...p, altPhone: e.target.value }))} small />
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Check Preference</label>
                <select value={form.checkPref} onChange={(e) => setForm(p => ({ ...p, checkPref: e.target.value }))}
                  style={{ padding: "8px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13 }}>
                  <option value="pickup">Pickup</option>
                  <option value="mail">Mail</option>
                </select>
              </div>
              {form.checkPref === "mail" && <InputField label="Mailing Address" value={form.mailingAddress} onChange={(e) => setForm(p => ({ ...p, mailingAddress: e.target.value }))} small />}
              <CheckboxField label="Returning Driver" checked={form.returning} onChange={(e) => setForm(p => ({ ...p, returning: e.target.checked }))} />
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14, fontSize: 13 }}>
              {[["Email", driver.email], ["Phone", driver.phone], ["Alt Phone", driver.altPhone || "—"], ["Check Preference", driver.checkPref === "pickup" ? "Pickup at Family Florist" : "Mail"],
                ...(driver.checkPref === "mail" ? [["Mailing Address", driver.mailingAddress || "—"]] : [])].map(([l, v]) => (
                <div key={l}><div style={{ color: COLORS.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{l}</div><div style={{ fontWeight: 500 }}>{v}</div></div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Documents & Compliance">
          {editing ? (
            <div>
              <CheckboxField label="Driver's License on File" checked={form.hasDL} onChange={(e) => setForm(p => ({ ...p, hasDL: e.target.checked }))} />
              <CheckboxField label="Insurance Card on File" checked={form.hasInsurance} onChange={(e) => setForm(p => ({ ...p, hasInsurance: e.target.checked }))} />
              <CheckboxField label="Liability Waiver Signed" checked={form.signedLiability} onChange={(e) => setForm(p => ({ ...p, signedLiability: e.target.checked }))} />
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {[
                { label: "Driver's License", ok: driver.hasDL, url: driver.dlFileUrl, type: "dl" },
                { label: "Insurance Card", ok: driver.hasInsurance, url: driver.insuranceFileUrl, type: "insurance" },
                { label: "Liability Waiver", ok: driver.signedLiability, url: driver.waiverFileUrl, type: "waiver" },
              ].map((doc) => (
                <div key={doc.label} style={{ padding: "12px 14px", background: doc.ok ? "#f0faf4" : COLORS.rosePale, borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: doc.url || !doc.ok ? 8 : 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{doc.label}</span>
                    <Badge color={doc.ok ? COLORS.success : COLORS.danger}>{doc.ok ? "On File" : "Missing"}</Badge>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: COLORS.forest, textDecoration: "underline", fontWeight: 500 }}>
                        View Document
                      </a>
                    )}
                    <label style={{ fontSize: 12, color: COLORS.forest, cursor: "pointer", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff" }}>
                      {uploading === doc.type ? "Uploading..." : doc.url ? "Replace" : "Upload"}
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => handleFileUpload(e, doc.type)} style={{ display: "none" }} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Rating & Notes">
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase" }}>Driver Rating</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <StarRating current={driver.rating || 0} onRate={setRating} />
              <span style={{ fontSize: 13, color: COLORS.textMuted }}>{driver.rating ? `${driver.rating}/5` : "Not rated"}</span>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase" }}>Notes & Comments</label>
              {!editingNotes && <Btn small variant="ghost" icon="edit" onClick={() => { setNotesText(driver.notes || ""); setEditingNotes(true); }}>Edit</Btn>}
            </div>
            {editingNotes ? (
              <div>
                <textarea value={notesText} onChange={(e) => setNotesText(e.target.value)} placeholder="Add notes about this driver... (performance, reliability, special skills, etc.)"
                  style={{ width: "100%", height: 100, padding: 12, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Btn small icon="check" onClick={saveNotes}>Save</Btn>
                  <Btn small variant="ghost" onClick={() => setEditingNotes(false)}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <div style={{ padding: "12px 14px", background: COLORS.cream, borderRadius: 8, fontSize: 13, lineHeight: 1.6, minHeight: 60, color: driver.notes ? COLORS.text : COLORS.textMuted, fontStyle: driver.notes ? "normal" : "italic" }}>
                {driver.notes || "No notes yet. Click Edit to add comments about this driver."}
              </div>
            )}
          </div>
        </Card>

        <Card title={`Pay Summary — ${event?.name}`}>
          <div style={{ display: "grid", gap: 12, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: COLORS.textMuted }}>Role</span><Badge color={driver.role === "dispatcher" ? COLORS.purple : COLORS.forest}>{driver.role === "dispatcher" ? "Dispatcher" : "Driver"}</Badge></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: COLORS.textMuted }}>Total Hours</span><span style={{ fontWeight: 600 }}>{formatHours(totals.totalHours)} hrs</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: COLORS.textMuted }}>Hourly Pay ({formatCurrency(rate)}/hr)</span><span style={{ fontWeight: 600 }}>{formatCurrency(totals.totalHours * rate)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: COLORS.textMuted }}>Fuel Reimbursement</span><span style={{ fontWeight: 600 }}>{formatCurrency(totals.totalFuel)}</span></div>
            <hr style={{ border: "none", borderTop: `1px solid ${COLORS.border}`, margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700, fontSize: 14 }}>Total Pay</span><span style={{ fontWeight: 700, fontSize: 16, color: COLORS.forest }}>{formatCurrency(totals.totalPay)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: COLORS.textMuted }}>Status</span><Badge color={evtData?.paid ? COLORS.success : COLORS.warning}>{evtData?.paid ? "Paid" : "Unpaid"}</Badge></div>
          </div>
        </Card>

        <Card title={`Schedule & Availability — ${event?.name}`} style={{ gridColumn: "1 / -1" }}>
          {event?.days?.length > 0 ? event.days.map(day => {
            const isScheduled = evtData?.scheduled?.[day.id];
            const avail = evtData?.availability?.[day.id] || "all_day";
            const partial = evtData?.partialHours?.[day.id] || "";
            return (
              <div key={day.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, padding: "12px 16px", background: isScheduled ? "#f0faf4" : COLORS.cream, borderRadius: 8, border: isScheduled ? `1px solid ${COLORS.success}` : `1px solid ${COLORS.borderLight}` }}>
                <button onClick={() => {
                  const currentScheduled = evtData?.scheduled || {};
                  saveDriverEvent(driver.id, activeEvent, "scheduled", { ...currentScheduled, [day.id]: !isScheduled });
                }} style={{ width: 32, height: 32, borderRadius: 8, border: `2px solid ${isScheduled ? COLORS.success : COLORS.border}`, background: isScheduled ? COLORS.success : "#fff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {isScheduled ? "✓" : ""}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{day.label}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{day.startTime} – {day.endTime}</div>
                </div>
                <select value={avail} onChange={(e) => {
                  const currentAvail = evtData?.availability || {};
                  saveDriverEvent(driver.id, activeEvent, "availability", { ...currentAvail, [day.id]: e.target.value });
                }} style={{ padding: "6px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12 }}>
                  <option value="all_day">All Day</option>
                  <option value="partial">Partial</option>
                  <option value="unavailable">Unavailable</option>
                </select>
                {avail === "partial" && (
                  <input type="text" placeholder="e.g. 8AM-3PM" value={partial} onChange={(e) => {
                    const currentPartial = evtData?.partialHours || {};
                    saveDriverEvent(driver.id, activeEvent, "partialHours", { ...currentPartial, [day.id]: e.target.value });
                  }} style={{ padding: "6px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, width: 120 }} />
                )}
                <Badge color={isScheduled ? COLORS.success : COLORS.textMuted}>{isScheduled ? "Scheduled" : "Not Scheduled"}</Badge>
              </div>
            );
          }) : <p style={{ fontSize: 13, color: COLORS.textMuted, fontStyle: "italic" }}>No event days set up yet. Add days in Event Settings.</p>}
        </Card>

        <Card title="Danger Zone" style={{ borderColor: "#fecaca", gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Remove this driver</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>This will delete the driver and all their data.</div>
            </div>
            <Btn small variant="danger" icon="delete" onClick={() => { if (confirm("Are you sure you want to remove " + driver.name + "?")) removeDriver(driver.id); }}>Remove</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULE, HOURS, SUMMARY, TEMPLATES, SIGNUP, PRINT
// ═══════════════════════════════════════════════════════════════
function ScheduleView({ event, drivers, activeEvent, setPrintMode, saveDriverEvent }) {
  const [showAddDriver, setShowAddDriver] = useState(null);
  if (!event) return null;
  const eventDrivers = drivers.filter((d) => d.events?.[activeEvent]);

  function toggleScheduled(driverId, dayId) {
    const driver = drivers.find(d => d.id === driverId);
    const evtData = driver?.events?.[activeEvent];
    const currentScheduled = evtData?.scheduled || {};
    saveDriverEvent(driverId, activeEvent, "scheduled", { ...currentScheduled, [dayId]: !currentScheduled[dayId] });
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Schedule — {event.name}</h2>
        <Btn icon="print" onClick={() => setPrintMode("schedule")}>Print Schedule</Btn>
      </div>
      {event.days.map((day) => {
        const dayDrivers = drivers.filter((d) => d.events?.[activeEvent]?.scheduled?.[day.id]);
        const unscheduled = eventDrivers.filter((d) => !d.events?.[activeEvent]?.scheduled?.[day.id]);
        return (
          <Card key={day.id} title={day.label} style={{ marginBottom: 20 }} action={<span style={{ fontSize: 12, color: COLORS.textMuted }}>{dayDrivers.length} / {event.driversNeeded}</span>}>
            {dayDrivers.length === 0 ? <p style={{ color: COLORS.textMuted, fontSize: 13, fontStyle: "italic" }}>No drivers scheduled.</p> : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ borderBottom: `2px solid ${COLORS.borderLight}` }}>
                  {["#", "Name", "Role", "Phone", "Availability", ""].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: COLORS.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{dayDrivers.map((d, i) => {
                  const avail = d.events[activeEvent]?.availability?.[day.id];
                  return (
                    <tr key={d.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                      <td style={{ padding: "10px 12px", color: COLORS.textMuted }}>{i + 1}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 500 }}>{d.name}</td>
                      <td style={{ padding: "10px 12px" }}><Badge color={d.role === "dispatcher" ? COLORS.purple : COLORS.forest}>{d.role === "dispatcher" ? "Dispatch" : "Driver"}</Badge></td>
                      <td style={{ padding: "10px 12px", color: COLORS.textMuted }}>{d.phone}</td>
                      <td style={{ padding: "10px 12px" }}>{avail === "all_day" ? <Badge color={COLORS.success}>All Day</Badge> : avail === "partial" ? <Badge color={COLORS.gold}>Partial</Badge> : <Badge color={COLORS.textMuted}>—</Badge>}</td>
                      <td style={{ padding: "10px 12px" }}><Btn small variant="ghost" style={{ color: COLORS.danger, fontSize: 11 }} onClick={() => toggleScheduled(d.id, day.id)}>Remove</Btn></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              {showAddDriver === day.id ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", padding: "10px 14px", background: COLORS.cream, borderRadius: 8, width: "100%" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginRight: 4 }}>Add to this day:</span>
                  {unscheduled.length === 0 ? <span style={{ fontSize: 12, color: COLORS.textMuted, fontStyle: "italic" }}>All drivers are already scheduled</span> : unscheduled.map(d => (
                    <button key={d.id} onClick={() => { toggleScheduled(d.id, day.id); }}
                      style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${COLORS.border}`, background: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                      + {d.name}
                    </button>
                  ))}
                  <Btn small variant="ghost" icon="close" onClick={() => setShowAddDriver(null)} />
                </div>
              ) : (
                <Btn small variant="secondary" icon="add" onClick={() => setShowAddDriver(day.id)}>Add Driver to {day.label}</Btn>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function HoursView({ event, drivers, activeEvent, saveDriverEvent }) {
  const [editingDay, setEditingDay] = useState(event?.days?.[0]?.id || "");
  if (!event) return null;
  const dayDrivers = drivers.filter((d) => d.events?.[activeEvent]?.scheduled?.[editingDay]);

  function updateHours(driverId, field, value) {
    const driver = drivers.find(d => d.id === driverId);
    const currentHours = driver?.events?.[activeEvent]?.hours || {};
    const dayHours = currentHours[editingDay] || {};
    const newDayHours = { ...dayHours, [field]: value };
    const newHours = { ...currentHours, [editingDay]: newDayHours };
    saveDriverEvent(driverId, activeEvent, "hours", newHours);
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Hours & Pay Entry</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {event.days.map((d) => (
          <button key={d.id} onClick={() => setEditingDay(d.id)}
            style={{ padding: "10px 20px", borderRadius: 8, border: `1.5px solid ${editingDay === d.id ? COLORS.forest : COLORS.border}`, background: editingDay === d.id ? COLORS.forest : COLORS.white, color: editingDay === d.id ? "#fff" : COLORS.text, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{d.label}</button>
        ))}
      </div>
      <Card padding={0}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 950 }}>
            <thead><tr style={{ borderBottom: `2px solid ${COLORS.borderLight}`, background: COLORS.cream }}>
              {["Driver", "Role", "Rate", "Time In", "Time Out", "Time In 2", "Time Out 2", "Hrs", "Fuel $", "Daily Total"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "12px 10px", color: COLORS.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{dayDrivers.map((d) => {
              const hours = d.events[activeEvent]?.hours?.[editingDay] || {};
              const totalHrs = calcHours(hours.timeIn1, hours.timeOut1) + calcHours(hours.timeIn2, hours.timeOut2);
              const rate = getDriverRate(d, event);
              return (
                <tr key={d.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                  <td style={{ padding: "10px", fontWeight: 500 }}>{d.name}</td>
                  <td style={{ padding: "10px" }}><Badge color={d.role === "dispatcher" ? COLORS.purple : COLORS.forest}>{d.role === "dispatcher" ? "Disp" : "Drv"}</Badge></td>
                  <td style={{ padding: "10px", fontWeight: 600, color: d.role === "dispatcher" ? COLORS.purple : COLORS.forest }}>{formatCurrency(rate)}</td>
                  {["timeIn1", "timeOut1", "timeIn2", "timeOut2"].map((field) => (
                    <td key={field} style={{ padding: "6px 4px" }}>
                      <input type="time" value={hours[field] || ""} onChange={(e) => updateHours(d.id, field, e.target.value)}
                        style={{ padding: "6px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, width: 95 }} />
                    </td>
                  ))}
                  <td style={{ padding: "10px", fontWeight: 600, color: COLORS.forest }}>{formatHours(totalHrs)}</td>
                  <td style={{ padding: "6px 4px" }}>
                    <input type="number" min="0" step="0.01" value={hours.fuel || ""} onChange={(e) => updateHours(d.id, "fuel", e.target.value)}
                      style={{ padding: "6px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, width: 65 }} />
                  </td>
                  <td style={{ padding: "10px", fontWeight: 700 }}>{formatCurrency(totalHrs * rate + (Number(hours.fuel) || 0))}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
        {dayDrivers.length === 0 && <p style={{ padding: 24, color: COLORS.textMuted, fontSize: 13, textAlign: "center", fontStyle: "italic" }}>No drivers scheduled for this day.</p>}
      </Card>
    </div>
  );
}

function SummaryView({ event, drivers, activeEvent, setPrintMode, saveDriverEvent }) {
  if (!event) return null;
  const scheduled = drivers.filter((d) => { const s = d.events?.[activeEvent]?.scheduled; return s && Object.values(s).some(Boolean); });
  const grandTotal = scheduled.reduce((s, d) => s + calcDriverEventTotal(d, activeEvent, event).totalPay, 0);
  const grandHours = scheduled.reduce((s, d) => s + calcDriverEventTotal(d, activeEvent, event).totalHours, 0);
  const grandFuel = scheduled.reduce((s, d) => s + calcDriverEventTotal(d, activeEvent, event).totalFuel, 0);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Pay Summary — {event.name}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn icon="print" variant="secondary" onClick={() => setPrintMode("individual")}>Print Individual</Btn>
          <Btn icon="print" onClick={() => setPrintMode("summary")}>Print Summary</Btn>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Hours" value={formatHours(grandHours)} icon="clock" />
        <StatCard label="Total Fuel" value={formatCurrency(grandFuel)} icon="money" color={COLORS.gold} />
        <StatCard label="Total Payroll" value={formatCurrency(grandTotal)} icon="money" color={COLORS.rose} />
      </div>
      <Card padding={0}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 1000 }}>
            <thead><tr style={{ borderBottom: `2px solid ${COLORS.borderLight}`, background: COLORS.cream }}>
              {["Driver", "Role", "Rate", "Hours", "Pay", "Fuel", "Total", "Check #", "Pref", "Status"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "12px 10px", color: COLORS.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{scheduled.map((d) => {
              const t = calcDriverEventTotal(d, activeEvent, event);
              const rate = getDriverRate(d, event);
              const evtData = d.events[activeEvent];
              return (
                <tr key={d.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                  <td style={{ padding: "10px", fontWeight: 500 }}>{d.name}</td>
                  <td style={{ padding: "10px" }}><Badge color={d.role === "dispatcher" ? COLORS.purple : COLORS.forest}>{d.role === "dispatcher" ? "Disp" : "Drv"}</Badge></td>
                  <td style={{ padding: "10px", fontWeight: 600, color: d.role === "dispatcher" ? COLORS.purple : COLORS.forest }}>{formatCurrency(rate)}</td>
                  <td style={{ padding: "10px" }}>{formatHours(t.totalHours)}</td>
                  <td style={{ padding: "10px" }}>{formatCurrency(t.totalHours * rate)}</td>
                  <td style={{ padding: "10px" }}>{formatCurrency(t.totalFuel)}</td>
                  <td style={{ padding: "10px", fontWeight: 700, color: COLORS.forest }}>{formatCurrency(t.totalPay)}</td>
                  <td style={{ padding: "6px" }}><input type="text" value={evtData?.checkNumber || ""} placeholder="—" onChange={(e) => saveDriverEvent(d.id, activeEvent, "checkNumber", e.target.value)} style={{ padding: "6px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, width: 70 }} /></td>
                  <td style={{ padding: "10px", fontSize: 12 }}>{d.checkPref === "pickup" ? "Pick" : "Mail"}</td>
                  <td style={{ padding: "10px" }}>
                    <button onClick={() => saveDriverEvent(d.id, activeEvent, "paid", !evtData?.paid)}
                      style={{ padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: evtData?.paid ? "#e8f5e9" : "#fff3e0", color: evtData?.paid ? COLORS.success : COLORS.warning }}>
                      {evtData?.paid ? "✓ Paid" : "Unpaid"}
                    </button>
                  </td>
                </tr>
              );
            })}</tbody>
            <tfoot><tr style={{ background: COLORS.cream, borderTop: `2px solid ${COLORS.border}` }}>
              <td colSpan={3} style={{ padding: "12px 10px", fontWeight: 700 }}>TOTALS</td>
              <td style={{ padding: "12px 10px", fontWeight: 700 }}>{formatHours(grandHours)}</td>
              <td style={{ padding: "12px 10px" }}>—</td>
              <td style={{ padding: "12px 10px", fontWeight: 700 }}>{formatCurrency(grandFuel)}</td>
              <td style={{ padding: "12px 10px", fontWeight: 700, color: COLORS.forest, fontSize: 15 }}>{formatCurrency(grandTotal)}</td>
              <td colSpan={3} style={{ padding: "12px 10px", fontSize: 12, color: COLORS.textMuted }}>Due: {event.checkDate}</td>
            </tr></tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TemplatesView() {
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Templates & Files</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {SAMPLE_TEMPLATES.map((t) => (
          <Card key={t.id} padding={20}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: t.type === "PDF" ? "#fdf0ef" : "#e8f4fd", display: "flex", alignItems: "center", justifyContent: "center", color: t.type === "PDF" ? COLORS.rose : "#2980b9", fontWeight: 700, fontSize: 11 }}>{t.type}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>{t.description}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SignupView({ event, events, saveEvent, activeEvent, showToast, showSignupPreview, setShowSignupPreview }) {
  const [editingIntro, setEditingIntro] = useState(false);
  const [introText, setIntroText] = useState(event?.signupIntro || "");
  const signupLink = `https://familyflorist.app/signup/${event?.holiday?.toLowerCase().replace(/[^a-z]/g, "-")}-${event?.year}`;

  useEffect(() => { setIntroText(event?.signupIntro || ""); }, [event?.id]);

  function handleSaveIntro() {
    saveEvent(activeEvent, { signupIntro: introText });
    setEditingIntro(false);
    showToast("Signup intro updated!");
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Driver Signup Form</h2>

      <Card title="Signup Form Introduction" style={{ marginBottom: 20 }} action={<Btn small variant="ghost" icon="edit" onClick={() => setEditingIntro(!editingIntro)}>{editingIntro ? "Cancel" : "Edit"}</Btn>}>
        {editingIntro ? (
          <div>
            <textarea value={introText} onChange={(e) => setIntroText(e.target.value)}
              style={{ width: "100%", height: 100, padding: 12, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
            <Btn small icon="check" onClick={handleSaveIntro} style={{ marginTop: 8 }}>Save</Btn>
          </div>
        ) : (
          <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>{event?.signupIntro}</p>
        )}
      </Card>

      <Card title="Document Links" style={{ marginBottom: 20 }}>
        {[["Driver Information Packet", event?.infoPacketUrl], ["Liability Waiver", event?.liabilityWaiverUrl]].map(([label, url]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: url ? "#f0faf4" : "#fff8e1", borderRadius: 8, marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{url ? "Link set" : "Not set — add in Event Settings"}</div>
            </div>
            <Badge color={url ? COLORS.success : COLORS.warning}>{url ? "Active" : "Not Set"}</Badge>
          </div>
        ))}
      </Card>

      <Btn variant="secondary" onClick={() => setShowSignupPreview(!showSignupPreview)} style={{ marginBottom: 20 }}>{showSignupPreview ? "Hide Preview" : "Preview Form"}</Btn>

      {showSignupPreview && (
        <Card padding={0} style={{ overflow: "hidden" }}>
          <div style={{ background: `linear-gradient(135deg, ${COLORS.forestDark}, ${COLORS.forest})`, padding: "32px 40px", textAlign: "center" }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#fff" }}>Family Florist</span>
          </div>
          <div style={{ padding: "32px 40px", maxWidth: 640, margin: "0 auto" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, textAlign: "center", marginBottom: 28 }}>{event?.holiday} Flower Delivery Sign-up</h3>
            <div style={{ background: COLORS.cream, borderRadius: 10, padding: 20, marginBottom: 24, fontSize: 13, lineHeight: 1.7 }}>
              {event?.signupIntro} Earn <strong>{formatCurrency(event?.ratePerHour || 15)}/hour</strong> plus gas reimbursement.
            </div>
            {[{ label: "Name", req: true }, { label: "Email", req: true }, { label: "Phone", req: true }].map((f) => (
              <div key={f.label} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{f.label} {f.req && <span style={{ color: COLORS.rose }}>*</span>}</label>
                <input disabled style={{ width: "100%", padding: "10px 14px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, background: "#fafafa" }} />
              </div>
            ))}
            <button disabled style={{ width: "100%", padding: 14, background: COLORS.forest, color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, opacity: 0.7 }}>Submit Application</button>
          </div>
        </Card>
      )}
    </div>
  );
}

function PrintView({ mode, event, drivers, activeEvent, onClose }) {
  if (!event) return null;
  const scheduled = drivers.filter((d) => { const s = d.events?.[activeEvent]?.scheduled; return s && Object.values(s).some(Boolean); });

  return (
    <div style={{ fontFamily: "'Libre Franklin', sans-serif", padding: 40, background: "#fff", minHeight: "100vh" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 30 }}>
        <Btn variant="ghost" icon="back" onClick={onClose}>Back</Btn>
        <Btn icon="print" onClick={() => window.print()}>Print</Btn>
      </div>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div style={{ textAlign: "center", marginBottom: 30, borderBottom: `2px solid ${COLORS.forest}`, paddingBottom: 16 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: COLORS.forest }}>Family Florist</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>{event.name}</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>Driver: {formatCurrency(event.ratePerHour)}/hr · Dispatcher: {formatCurrency(event.dispatcherRate || event.ratePerHour)}/hr</div>
      </div>

      {mode === "schedule" && event.days.map((day) => {
        const dd = drivers.filter((d) => d.events?.[activeEvent]?.scheduled?.[day.id]);
        return (
          <div key={day.id} style={{ marginBottom: 30 }}>
            <h4 style={{ fontSize: 14, padding: "6px 12px", background: "#f5f5f5", borderRadius: 4 }}>{day.label}</h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr>{["#", "Name", "Role", "Phone", "Avail"].map((h) => <th key={h} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "2px solid #333", fontSize: 11 }}>{h}</th>)}</tr></thead>
              <tbody>{dd.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "6px 10px" }}>{i + 1}</td><td style={{ padding: "6px 10px", fontWeight: 500 }}>{d.name}</td>
                  <td style={{ padding: "6px 10px" }}>{d.role === "dispatcher" ? "Dispatch" : "Driver"}</td><td style={{ padding: "6px 10px" }}>{d.phone}</td>
                  <td style={{ padding: "6px 10px" }}>{d.events[activeEvent]?.availability?.[day.id] === "all_day" ? "All Day" : "Partial"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        );
      })}

      {mode === "summary" && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr>{["Name", "Role", "Rate", "Hrs", "Pay", "Fuel", "Total", "Chk#", "Del"].map((h) => <th key={h} style={{ textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #333", fontSize: 11 }}>{h}</th>)}</tr></thead>
          <tbody>{scheduled.map((d) => {
            const t = calcDriverEventTotal(d, activeEvent, event); const rate = getDriverRate(d, event);
            return (
              <tr key={d.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "6px 8px", fontWeight: 500 }}>{d.name}</td>
                <td style={{ padding: "6px 8px" }}>{d.role === "dispatcher" ? "Disp" : "Drv"}</td>
                <td style={{ padding: "6px 8px" }}>{formatCurrency(rate)}</td>
                <td style={{ padding: "6px 8px" }}>{formatHours(t.totalHours)}</td>
                <td style={{ padding: "6px 8px" }}>{formatCurrency(t.totalHours * rate)}</td>
                <td style={{ padding: "6px 8px" }}>{formatCurrency(t.totalFuel)}</td>
                <td style={{ padding: "6px 8px", fontWeight: 700 }}>{formatCurrency(t.totalPay)}</td>
                <td style={{ padding: "6px 8px" }}>{d.events[activeEvent]?.checkNumber || "—"}</td>
                <td style={{ padding: "6px 8px" }}>{d.checkPref === "pickup" ? "Pick" : "Mail"}</td>
              </tr>
            );
          })}</tbody>
          <tfoot><tr style={{ borderTop: "2px solid #333" }}>
            <td colSpan={3} style={{ padding: "8px", fontWeight: 700 }}>TOTALS</td>
            <td style={{ padding: "8px", fontWeight: 700 }}>{formatHours(scheduled.reduce((s, d) => s + calcDriverEventTotal(d, activeEvent, event).totalHours, 0))}</td>
            <td>—</td><td style={{ padding: "8px", fontWeight: 700 }}>{formatCurrency(scheduled.reduce((s, d) => s + calcDriverEventTotal(d, activeEvent, event).totalFuel, 0))}</td>
            <td style={{ padding: "8px", fontWeight: 700 }}>{formatCurrency(scheduled.reduce((s, d) => s + calcDriverEventTotal(d, activeEvent, event).totalPay, 0))}</td>
            <td colSpan={2} style={{ padding: "8px", fontSize: 11 }}>Due: {event.checkDate}</td>
          </tr></tfoot>
        </table>
      )}

      {mode === "individual" && scheduled.map((d, idx) => {
        const t = calcDriverEventTotal(d, activeEvent, event); const rate = getDriverRate(d, event); const evtData = d.events[activeEvent];
        return (
          <div key={d.id} style={{ pageBreakAfter: idx < scheduled.length - 1 ? "always" : "auto", marginBottom: 40 }}>
            <h4>{d.name} <span style={{ fontSize: 11, fontWeight: 400, color: "#999" }}>({d.role === "dispatcher" ? "Dispatcher @ " + formatCurrency(rate) + "/hr" : "Driver @ " + formatCurrency(rate) + "/hr"})</span></h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 16 }}>
              <thead><tr>{["Day", "In", "Out", "In 2", "Out 2", "Hrs", "Fuel"].map((h) => <th key={h} style={{ textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #333", fontSize: 10 }}>{h}</th>)}</tr></thead>
              <tbody>{event.days.map((day) => {
                if (!evtData?.scheduled?.[day.id]) return null;
                const h = evtData?.hours?.[day.id] || {};
                return (
                  <tr key={day.id} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "6px 8px" }}>{day.label}</td>
                    <td style={{ padding: "6px 8px" }}>{h.timeIn1 || "—"}</td><td style={{ padding: "6px 8px" }}>{h.timeOut1 || "—"}</td>
                    <td style={{ padding: "6px 8px" }}>{h.timeIn2 || "—"}</td><td style={{ padding: "6px 8px" }}>{h.timeOut2 || "—"}</td>
                    <td style={{ padding: "6px 8px", fontWeight: 600 }}>{formatHours(calcHours(h.timeIn1, h.timeOut1) + calcHours(h.timeIn2, h.timeOut2))}</td>
                    <td style={{ padding: "6px 8px" }}>{formatCurrency(Number(h.fuel) || 0)}</td>
                  </tr>
                );
              })}</tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 20, fontSize: 12, borderTop: "2px solid #333", paddingTop: 10 }}>
              <span>Hours: <strong>{formatHours(t.totalHours)}</strong></span>
              <span>Pay: <strong>{formatCurrency(t.totalHours * rate)}</strong></span>
              <span>Fuel: <strong>{formatCurrency(t.totalFuel)}</strong></span>
              <span style={{ fontSize: 14 }}>TOTAL: <strong>{formatCurrency(t.totalPay)}</strong></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
