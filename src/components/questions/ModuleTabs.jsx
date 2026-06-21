const modules = [
  { key: "reading", label: "Reading" },
  { key: "listening", label: "Listening" },
  { key: "writing", label: "Writing" },
  { key: "speaking", label: "Speaking" },
];

export default function ModuleTabs({ activeModule, onChange }) {
  return (
    <div style={styles.tabs}>
      {modules.map((m) => (
        <button
          key={m.key}
          style={activeModule === m.key ? styles.activeTab : styles.tab}
          onClick={() => onChange(m.key)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

const styles = {
  tabs: { display: "flex", gap: "8px", marginBottom: "20px" },
  tab: { padding: "10px 20px", backgroundColor: "white", color: "#333", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontSize: "14px" },
  activeTab: { padding: "10px 20px", backgroundColor: "#1a1a2e", color: "white", border: "1px solid #1a1a2e", borderRadius: "6px", cursor: "pointer", fontSize: "14px" },
};