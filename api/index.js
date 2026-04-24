const express = require("express");
const cors    = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const USER_ID     = "TanayGupta_04032006";
const EMAIL_ID    = "tg7803@srmist.edu.in";
const COLLEGE_REG = "RA2311030010109";

const VALID_EDGE = /^[A-Z]->[A-Z]$/;

class UF {
  constructor() { this._p = {}; }
  _init(x) { if (this._p[x] === undefined) this._p[x] = x; }
  find(x) {
    this._init(x);
    if (this._p[x] !== x) this._p[x] = this.find(this._p[x]);
    return this._p[x];
  }
  union(a, b) { this._p[this.find(a)] = this.find(b); }
}

function buildTree(node, ch) {
  const kids = ch.get(node) || [];
  const obj  = {};
  for (const k of kids) obj[k] = buildTree(k, ch);
  return obj;
}

function calcDepth(node, ch) {
  const kids = ch.get(node) || [];
  if (!kids.length) return 1;
  return 1 + Math.max(...kids.map(k => calcDepth(k, ch)));
}

function hasCycle(nodes, ch) {
  const state = {}; // 0=unvisited 1=in-stack 2=done
  for (const n of nodes) state[n] = 0;

  function dfs(u) {
    state[u] = 1;
    for (const v of (ch.get(u) || [])) {
      if (!nodes.has(v)) continue;
      if (state[v] === 1) return true;
      if (state[v] === 0 && dfs(v)) return true;
    }
    state[u] = 2;
    return false;
  }

  for (const n of nodes) if (state[n] === 0 && dfs(n)) return true;
  return false;
}

function processData(data) {
  const invalid_entries  = [];
  const duplicate_edges  = [];
  const seen             = new Set();
  const validEdges       = [];

  for (const raw of data) {
    const entry = (raw == null ? "" : String(raw)).trim();

    if (!VALID_EDGE.test(entry)) {
      invalid_entries.push(String(raw));
      continue;
    }

    const [parent, child] = entry.split("->");

    if (parent === child) {
      invalid_entries.push(entry);
      continue;
    }


    if (seen.has(entry)) {
      if (!duplicate_edges.includes(entry)) duplicate_edges.push(entry);
      continue;
    }

    seen.add(entry);
    validEdges.push({ parent, child, label: entry });
  }


  const childToParents   = new Map(); 
  const parentToChildren = new Map(); 
  const allNodes         = new Set();

  for (const { parent, child } of validEdges) {
    allNodes.add(parent);
    allNodes.add(child);

  
    if (!childToParents.has(child)) childToParents.set(child, new Set());
    childToParents.get(child).add(parent);

   
    if (!parentToChildren.has(parent)) parentToChildren.set(parent, []);
    // Avoid adding the same child twice under the same parent
    if (!parentToChildren.get(parent).includes(child)) {
      parentToChildren.get(parent).push(child);
    }
  }

  
  const uf = new UF();
  for (const { parent, child } of validEdges) uf.union(parent, child);

  const groups = new Map();
  for (const node of allNodes) {
    const rep = uf.find(node);
    if (!groups.has(rep)) groups.set(rep, new Set());
    groups.get(rep).add(node);
  }

  const repOrder    = [];
  const seenReps    = new Set();
  for (const { parent } of validEdges) {
    const rep = uf.find(parent);
    if (!seenReps.has(rep)) { seenReps.add(rep); repOrder.push(rep); }
  }


  const hierarchies = [];

  for (const rep of repOrder) {
    const nodes = groups.get(rep);

    const roots = [...nodes]
      .filter(n => !childToParents.has(n) ||
                   ![...childToParents.get(n)].some(p => nodes.has(p)))
      .sort();

    const root = roots.length > 0 ? roots[0] : [...nodes].sort()[0];

    if (hasCycle(nodes, parentToChildren)) {
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      const tree  = { [root]: buildTree(root, parentToChildren) };
      const depth = calcDepth(root, parentToChildren);
      hierarchies.push({ root, tree, depth });
    }
  }


  const nonCyclic = hierarchies.filter(h => !h.has_cycle);
  const cyclic    = hierarchies.filter(h =>  h.has_cycle);

  let largest_tree_root = "";
  if (nonCyclic.length > 0) {
    
    const sorted = [...nonCyclic].sort(
      (a, b) => b.depth - a.depth || a.root.localeCompare(b.root)
    );
    largest_tree_root = sorted[0].root;
  }

  return {
    user_id:             USER_ID,
    email_id:            EMAIL_ID,
    college_roll_number: COLLEGE_REG,
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees:       nonCyclic.length,
      total_cycles:      cyclic.length,
      largest_tree_root,
    },
  };
}

/* ── Routes ────────────────────────────────────────────────────────────── */
app.post("/bfhl", (req, res) => {
  const { data } = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: "`data` must be an array." });
  }
  try {
    return res.json(processData(data));
  } catch (err) {
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
});

app.get("/bfhl", (_req, res) =>
  res.json({ status: "ok", message: "BFHL API running – POST to /bfhl" })
);

app.get("/", (_req, res) => res.send("BFHL API is running. POST to /bfhl"));

/* ── Start ─────────────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BFHL server listening on port ${PORT}`));