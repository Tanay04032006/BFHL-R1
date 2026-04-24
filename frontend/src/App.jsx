import { useState } from "react";

const EXAMPLE =
  "A->B, A->C, B->D, C->E, E->F, X->Y, Y->Z, Z->X, P->Q, Q->R, G->H, G->H, G->I, hello, 1->2, A->";

const TreeNode = ({ node, children }) => {
  const keys = Object.keys(children || {});
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <div style={{
        padding: "3px 10px",
        border: "0.5px solid #333",
        borderRadius: 4,
        fontSize: 12,
        color: "#ccc",
        background: "#111116",
        whiteSpace: "nowrap",
      }}>
        {node}
      </div>

      {keys.length > 0 && (
        <>
          <div style={{ width: 1, height: 12, background: "#333" }} />
          <div style={{ display: "flex", alignItems: "flex-start", position: "relative" }}>
            {keys.map((child, i) => (
              <div key={child} style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingInline: 10 }}>
                <div style={{
                  width: "100%",
                  height: 1,
                  background: keys.length > 1 ? "#333" : "transparent",
                  marginBottom: 0,
                }} />
                <div style={{ width: 1, height: 12, background: "#333" }} />
                <TreeNode node={child} children={children[child]} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};  

export default function App() {
  const [input, setInput] = useState("");
  const [apiUrl, setApiUrl] = useState("https://bfhl-r1.onrender.com/bfhl");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);

  const submit = async () => {
    setError("");
    if (!input.trim()) return setError("Enter at least one edge");

    const parsed = input.split(/[\n,]/).map(s => s.trim()).filter(Boolean);

    try {
      setLoading(true);
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parsed })
      });

      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

const renderTree = (node, children, prefix = "", isLast = true) => {
  const connector = isLast ? "└── " : "├── ";
  const childPrefix = isLast ? "    " : "│   ";

  let str = (prefix ? prefix + connector : "") + node + "\n";

  const keys = Object.keys(children || {});
  keys.forEach((child, i) => {
    str += renderTree(
      child,
      children[child],
      prefix + childPrefix,   // ← always append, no condition
      i === keys.length - 1
    );
  });

  return str;
};

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 font-mono">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">
          BFHL <span className="text-purple-500">ROUND-1</span>
        </h1>

        {/* Input Card */}
        <div className="bg-[#111118] border border-gray-800 p-6 rounded-lg space-y-4">
          <input
            className="w-full bg-black border border-gray-700 p-2 rounded"
            value={apiUrl}
            onChange={e => setApiUrl(e.target.value)}
          />

          <textarea
            className="w-full bg-black border border-gray-700 p-3 rounded h-32"
            placeholder="Enter edges..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={submit}
              disabled={loading}
              className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Submit"}
            </button>

            <button
              onClick={() => setInput(EXAMPLE)}
              className="border border-gray-600 px-4 py-2 rounded"
            >
              Load Example
            </button>

            <button
              onClick={() => { setInput(""); setData(null); }}
              className="border border-gray-600 px-4 py-2 rounded"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 p-3 mt-4 rounded">
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="mt-6 space-y-6">

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#111118] p-4 rounded border border-gray-800">
                <p className="text-gray-400 text-xs">Total Trees</p>
                <p className="text-xl text-purple-400">{data.summary.total_trees}</p>
              </div>

              <div className="bg-[#111118] p-4 rounded border border-gray-800">
                <p className="text-gray-400 text-xs">Cycles</p>
                <p className="text-xl text-pink-400">{data.summary.total_cycles}</p>
              </div>

              <div className="bg-[#111118] p-4 rounded border border-gray-800">
                <p className="text-gray-400 text-xs">Largest Root</p>
                <p className="text-xl">{data.summary.largest_tree_root}</p>
              </div>

              <div className="bg-[#111118] p-4 rounded border border-gray-800">
                <p className="text-gray-400 text-xs">User ID</p>
                <p className="text-sm break-all">{data.user_id}</p>
              </div>
            </div>

            {/* Hierarchies */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Hierarchies</h2>

              {data.hierarchies.map((h, i) => (
                <div
                  key={i}
                  className="bg-[#111118] border border-gray-800 rounded mb-3"
                >
                  <div
                    className="flex justify-between items-center p-4 cursor-pointer"
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  >
                    <div>
                      <p className="font-bold">Root: {h.root}</p>
                      <p className="text-xs text-gray-400">
                        {h.has_cycle ? "Cycle" : `Depth: ${h.depth}`}
                      </p>
                    </div>

                    <span>
                      {h.has_cycle ? "🔁" : "🌳"}
                    </span>
                  </div>

                  {openIndex === i && (
                    <div className="p-4 border-t border-gray-800">
                      {h.has_cycle ? (
                        <p className="text-pink-400">Cycle detected</p>
                      ) : (
                        <div style={{ overflowX: "auto", paddingBottom: 4 }}>
  <TreeNode node={h.root} children={h.tree?.[h.root]} />
</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Invalid */}
            <div>
              <h2 className="text-lg mb-2">Invalid Entries</h2>
              <div className="flex flex-wrap gap-2">
                {data.invalid_entries.length === 0
                  ? "None"
                  : data.invalid_entries.map((e, i) => (
                      <span key={i} className="bg-red-500/20 px-2 py-1 rounded text-sm">
                        {e}
                      </span>
                    ))}
              </div>
            </div>

            {/* Duplicates */}
            <div>
              <h2 className="text-lg mb-2">Duplicate Edges</h2>
              <div className="flex flex-wrap gap-2">
                {data.duplicate_edges.length === 0
                  ? "None"
                  : data.duplicate_edges.map((e, i) => (
                      <span key={i} className="bg-yellow-400/20 px-2 py-1 rounded text-sm">
                        {e}
                      </span>
                    ))}
              </div>
            </div>

            {/* Raw JSON */}
            <details className="bg-black border border-gray-800 rounded">
              <summary className="p-3 cursor-pointer text-gray-400">
                Raw JSON
              </summary>
              <pre className="p-4 text-green-400 text-xs overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>

          </div>
        )}
      </div>
    </div>
  );
}