import React from "react";
import "./uiverse.css";

export const UiversePearlButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => {
  return (
    <button className="uiverse-pearl-btn" {...props}>
      {children}
    </button>
  );
};

export const UiverseToggle: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, ...props }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {label && <span style={{ color: "#333", fontWeight: 500 }}>{label}</span>}
      <label className="uiverse-toggle">
        <input type="checkbox" className="uiverse-toggle-checkbox" {...props} />
        <span className="uiverse-toggle-slider"></span>
      </label>
    </div>
  );
};

export const UiverseFormContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  return (
    <div className="uiverse-form-container" {...props}>
      {children}
    </div>
  );
};

export const UiverseInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  return <input className="uiverse-input" {...props} />;
};

export const UiverseLoader: React.FC = () => {
  return (
    <div className="uiverse-loader-container">
      <div className="uiverse-loader-spinner"></div>
    </div>
  );
};

export const UiverseRadio: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => {
  return (
    <label className="uiverse-radio-container">
      <input type="radio" className="uiverse-radio-input" {...props} />
      <div className="uiverse-radio-mark"></div>
      {label}
    </label>
  );
};
