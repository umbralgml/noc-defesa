// Lógica de rede pura, sem DOM: usada pelos motores e pelo validador (tools/validar-fases.mjs).

// IP dentro de um prefixo. Aceita /8, /16 e /24 (ou IP exato, sem barra).
export const inNet = (ip, net) => { const [a, m] = String(net).split('/'); if (!m) return ip === a; const n = +m / 8; return String(ip).split('.').slice(0, n).join('.') === a.split('.').slice(0, n).join('.'); };

// ---------- regras de firewall (fase "defense") ----------
// Uma regra casa com o pacote se todos os campos batem. src aceita prefixo.
export const matches = (m, p) => Object.entries(m).every(([k, v]) => k === 'src' ? inNet(p.src, v) : p[k] === v);

// ---------- topologia (fase "topo") ----------
export const lid = (a, b) => a < b ? `${a}-${b}` : `${b}-${a}`;
// Caminho mais curto (em saltos) da origem até o destino, ignorando enlaces de reserva desligados.
export function path(level, to) {
  const adj = {};
  level.links.filter(k => !k.off).forEach(k => { (adj[k.a] = adj[k.a] || []).push(k.b); (adj[k.b] = adj[k.b] || []).push(k.a); });
  const prev = { [level.from]: null }, q = [level.from];
  while (q.length) { const n = q.shift(); if (n === to) break; (adj[n] || []).forEach(m => { if (!(m in prev)) { prev[m] = n; q.push(m); } }); }
  if (!(to in prev)) return null;
  const p = []; for (let n = to; n !== null; n = prev[n]) p.unshift(n);
  return p;
}
// Até onde o ping chega: índice do último nó alcançado no caminho.
export function reach(level, p) {
  for (let i = 1; i < p.length; i++) if (level.fault === lid(p[i - 1], p[i]) || level.fault === p[i]) return i - 1;
  return p.length - 1;
}

// ---------- filtro de exibição (subconjunto do Wireshark) ----------
// Campos: protocolos (tcp, udp, icmp, dns, http, tls, ntp, ssh, arp), ip.src, ip.dst, ip.addr,
// eth.src, eth.dst (MAC), tcp/udp.port, .srcport, .dstport, tcp.flags.syn, tcp.flags.ack, tcp.flags.rst, http.request.method,
// dns.qry.name, frame.len. Operadores: == != > < >= <= e "contains"; && || ! and or not e parênteses.
export const L4 = { http: 'tcp', tls: 'tcp', ssh: 'tcp', smtp: 'tcp', dns: 'udp', ntp: 'udp', quic: 'udp', snmp: 'udp' };
const MAC = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i;
const flag = (p, f) => (p.flags || '').split(',').map(s => s.trim().toUpperCase()).includes(f) ? 1 : 0;
function field(p, f) {
  const pr = (p.proto || '').toLowerCase(), l4 = L4[pr] || pr;
  if (['tcp', 'udp', 'icmp', 'arp'].includes(f)) return l4 === f;
  if (f in L4 || f === 'http' || f === 'dns') return pr === f;
  switch (f) {
    case 'eth.src': return p.esrc || (MAC.test(p.src) ? p.src : undefined);
    case 'eth.dst': return p.edst || (MAC.test(p.dst) ? p.dst : undefined);
    case 'ip.src': return p.src; case 'ip.dst': return p.dst; case 'ip.addr': return [p.src, p.dst];
    case 'tcp.port': case 'udp.port': return l4 === f.slice(0, 3) ? [p.sport, p.dport] : undefined;
    case 'tcp.srcport': case 'udp.srcport': return l4 === f.slice(0, 3) ? p.sport : undefined;
    case 'tcp.dstport': case 'udp.dstport': return l4 === f.slice(0, 3) ? p.dport : undefined;
    case 'tcp.flags.syn': return l4 === 'tcp' ? flag(p, 'SYN') : undefined;
    case 'tcp.flags.ack': return l4 === 'tcp' ? flag(p, 'ACK') : undefined;
    case 'tcp.flags.rst': return l4 === 'tcp' ? flag(p, 'RST') : undefined;
    case 'http.request': return !!p.method;
    case 'http.request.method': return p.method;
    case 'dns.qry.name': return p.qname;
    case 'frame.len': return p.len;
  }
  throw new Error('campo desconhecido: ' + f);
}
const cmp = (a, op, b) => {
  if (Array.isArray(a)) return op === '!=' ? a.every(x => cmp(x, op, b)) : a.some(x => cmp(x, op, b));
  if (a === undefined || a === null) return false;
  if (op === 'contains') return String(a).toLowerCase().includes(String(b).toLowerCase());
  if (/^\d+\.\d+\.\d+\.\d+/.test(b)) return op === '==' ? inNet(a, b) : !inNet(a, b);
  const x = isNaN(a) ? a : +a, y = isNaN(b) ? b : +b;
  return op === '==' ? x == y : op === '!=' ? x != y : op === '>' ? x > y : op === '<' ? x < y : op === '>=' ? x >= y : x <= y;
};
// Compila o texto do filtro numa função p => boolean. Lança erro se a sintaxe não fecha.
export function compile(src) {
  const toks = (src.match(/"[^"]*"|&&|\|\||==|!=|>=|<=|[()!<>]|[\w.:\/-]+/g) || []).map(t => t.toLowerCase() === 'and' ? '&&' : t.toLowerCase() === 'or' ? '||' : t.toLowerCase() === 'not' ? '!' : t);
  let i = 0;
  const peek = () => toks[i], eat = t => { if (toks[i] !== t) throw new Error('esperava ' + t); i++; };
  const or = () => { let a = and(); while (peek() === '||') { i++; const b = and(), x = a; a = p => x(p) || b(p); } return a; };
  const and = () => { let a = un(); while (peek() === '&&') { i++; const b = un(), x = a; a = p => x(p) && b(p); } return a; };
  const un = () => { if (peek() === '!') { i++; const a = un(); return p => !a(p); } if (peek() === '(') { i++; const a = or(); eat(')'); return a; } return atom(); };
  const atom = () => {
    const f = toks[i++]; if (!f || /^[()!&|=<>]/.test(f)) throw new Error('filtro incompleto');
    field({}, f.toLowerCase());   // valida o nome do campo
    const op = peek();
    if (['==', '!=', '>', '<', '>=', '<=', 'contains'].includes(op)) {
      i++; const v = toks[i++]; if (v === undefined) throw new Error('falta o valor');
      const val = v.replace(/^"|"$/g, '');
      return p => cmp(field(p, f.toLowerCase()), op, val);
    }
    return p => { const v = field(p, f.toLowerCase()); return Array.isArray(v) ? v.some(x => x !== undefined) : !!v && v !== 0; };
  };
  if (!toks.length) return () => true;
  const fn = or(); if (i < toks.length) throw new Error('sobrou: ' + toks[i]);
  return fn;
}

