import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch

fig, ax = plt.subplots(figsize=(20, 14))
ax.set_xlim(0, 20)
ax.set_ylim(0, 14)
ax.axis('off')
fig.patch.set_facecolor('#F4F6F9')

# ── helpers ──────────────────────────────────────────────────────────────────

def node(ax, x, y, w, h, title, stereo=None,
         fc='#DDEEFF', ec='#2255AA', lw=2.0, r=0.25, zbase=2):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
        boxstyle=f"round,pad=0.04,rounding_size={r}",
        lw=lw, edgecolor=ec, facecolor=fc, zorder=zbase))
    # small tab
    ax.add_patch(FancyBboxPatch((x+0.15, y+h), 1.6, 0.32,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        lw=lw, edgecolor=ec, facecolor=fc, zorder=zbase))
    ty = y + h - 0.22
    if stereo:
        ax.text(x+w/2, ty, f'<<{stereo}>>', ha='center', va='top',
                fontsize=7, fontstyle='italic', color='#445566', zorder=zbase+1)
        ty -= 0.28
    ax.text(x+w/2, ty, title, ha='center', va='top',
            fontsize=9, fontweight='bold', color='#111133', zorder=zbase+1)

def comp(ax, x, y, w, h, title, sub=None,
         fc='#FFFFFF', ec='#334488', lw=1.4, zbase=4):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
        boxstyle="round,pad=0.04,rounding_size=0.12",
        lw=lw, edgecolor=ec, facecolor=fc, zorder=zbase))
    # component UML icon
    for dy in [0.18, 0.45]:
        ax.add_patch(FancyBboxPatch((x+0.08, y+dy), 0.28, 0.18,
            boxstyle="square,pad=0.01",
            lw=0.8, edgecolor=ec, facecolor='white', zorder=zbase+1))
    cx = x + w/2 + 0.12
    cy = y + h/2
    ax.text(cx, cy + (0.13 if sub else 0), title, ha='center', va='center',
            fontsize=8.5, fontweight='bold', color='#111133', zorder=zbase+1)
    if sub:
        ax.text(cx, cy - 0.2, sub, ha='center', va='center',
                fontsize=7, color='#556677', zorder=zbase+1)

def arrow(ax, x1, y1, x2, y2, lbl='', ec='#334488', ls='-', lw=1.8):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
        arrowprops=dict(arrowstyle='->', color=ec, lw=lw,
                        linestyle=ls, connectionstyle='arc3,rad=0.0'),
        zorder=8)
    if lbl:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx+0.08, my+0.14, lbl, fontsize=6.8, color=ec,
                ha='center', fontstyle='italic', zorder=9,
                bbox=dict(fc='white', ec='none', pad=0.5, alpha=0.8))

# ═══════════════════════════════════════════════════════════════════════════
# TITLE
# ═══════════════════════════════════════════════════════════════════════════
ax.text(10, 13.55, "Diagramme de Déploiement — Finance RAG",
        ha='center', fontsize=15, fontweight='bold', color='#111133')
ax.text(10, 13.15, "Architecture Multi-Tiers avec IA locale",
        ha='center', fontsize=9, color='#667788', fontstyle='italic')

# ═══════════════════════════════════════════════════════════════════════════
# TIER 1 — CLIENT  (top-left)
# ═══════════════════════════════════════════════════════════════════════════
node(ax, 0.5, 10.6, 5.0, 2.0, "Navigateur Web", stereo="device",
     fc='#E8F4FF', ec='#1A4A9F', lw=2.2)
comp(ax, 0.9, 10.85, 4.1, 1.0,
     "React 19 + TypeScript", "Vite  ·  port : 5173",
     fc='#F5FAFF', ec='#1A4A9F')

# ═══════════════════════════════════════════════════════════════════════════
# TIER 2 — APPLICATION  (top-center / top-right)
# ═══════════════════════════════════════════════════════════════════════════
node(ax, 6.3, 10.0, 13.0, 2.6, "Serveur Application", stereo="device",
     fc='#EAFAEA', ec='#1A6E1A', lw=2.2)
comp(ax, 6.8, 11.25, 5.6, 1.0,
     "FastAPI + Uvicorn", "Python 3.12  ·  port : 8000",
     fc='#F4FFF4', ec='#1A6E1A')
comp(ax, 13.0, 11.25, 5.7, 1.0,
     "Système de Fichiers Local",
     "storage/documents  ·  storage/reclamations",
     fc='#F4FFF4', ec='#1A6E1A')

# horizontal separator label
ax.text(6.3, 10.5, "REST API  ·  WebSocket", fontsize=7,
        color='#1A6E1A', fontstyle='italic')

# ═══════════════════════════════════════════════════════════════════════════
# TIER 3 — BASE DE DONNÉES  (bottom-left)
# ═══════════════════════════════════════════════════════════════════════════
node(ax, 0.5, 5.8, 5.0, 3.6, "Serveur Base de Données", stereo="device",
     fc='#FFF8E8', ec='#B05A00', lw=2.2)
comp(ax, 0.9, 7.8, 4.1, 1.0,
     "MongoDB", "port : 27017  ·  DB : finance_rag",
     fc='#FFFDF5', ec='#B05A00')
comp(ax, 0.9, 6.15, 4.1, 1.4,
     "Collections",
     "users · sessions · documents\nchats · réclamations · audits",
     fc='#FFFDF5', ec='#B05A00')

# ═══════════════════════════════════════════════════════════════════════════
# TIER 4 — QDRANT sur DOCKER  (bottom-center)
# ═══════════════════════════════════════════════════════════════════════════
node(ax, 6.3, 5.4, 5.8, 4.0, "Serveur Vectoriel", stereo="device",
     fc='#EFEFFF', ec='#3333AA', lw=2.2)

# Docker Engine
node(ax, 6.65, 5.65, 5.1, 3.35, "Docker Engine",
     stereo="execution environment",
     fc='#E4E4F8', ec='#5555CC', lw=1.7, r=0.18, zbase=3)

# Docker Container
node(ax, 7.0, 5.9, 4.4, 2.7, "qdrant/qdrant",
     stereo="Docker container",
     fc='#D8D8F5', ec='#7777DD', lw=1.3, r=0.14, zbase=4)

comp(ax, 7.35, 6.15, 3.7, 1.55,
     "Qdrant",
     "port : 6333  ·  distance : cosine\nvectors : 1024-dim (mxbai)",
     fc='#F0F0FF', ec='#7777DD', zbase=6)

# ═══════════════════════════════════════════════════════════════════════════
# TIER 5 — IA / LLM  (bottom-right)
# ═══════════════════════════════════════════════════════════════════════════
node(ax, 13.0, 5.4, 6.3, 4.0, "Serveur IA / LLM", stereo="device",
     fc='#FFF0FB', ec='#AA1177', lw=2.2)
comp(ax, 13.4, 8.0, 5.5, 1.0,
     "Ollama", "port : 11434",
     fc='#FFF8FD', ec='#AA1177')
comp(ax, 13.4, 6.75, 2.6, 0.95,
     "mxbai-embed-large", "Embeddings · 1024-dim",
     fc='#FFF8FD', ec='#CC44AA')
comp(ax, 16.2, 6.75, 2.7, 0.95,
     "llama3:latest", "Génération texte",
     fc='#FFF8FD', ec='#CC44AA')
comp(ax, 13.4, 5.7, 5.5, 0.8,
     "Spacy fr_core_news_md", "NLP  ·  Extraction articles",
     fc='#FFF8FD', ec='#AA1177')

# ═══════════════════════════════════════════════════════════════════════════
# TIER 6 — AUTH OIDC optionnel  (far bottom-left)
# ═══════════════════════════════════════════════════════════════════════════
node(ax, 0.5, 2.5, 5.0, 2.6, "Auth OIDC  (Optionnel)", stereo="device",
     fc='#F5F5F5', ec='#888888', lw=1.8)
comp(ax, 0.9, 3.9, 4.1, 0.9,
     "Keycloak", "port : 8080  ·  realm : rag-finance",
     fc='#FAFAFA', ec='#888888')
comp(ax, 0.9, 2.8, 4.1, 0.8,
     "OIDC / SSO", "openid · profile · email",
     fc='#FAFAFA', ec='#888888')

# ═══════════════════════════════════════════════════════════════════════════
# ARROWS
# ═══════════════════════════════════════════════════════════════════════════
# Client → Backend
arrow(ax, 5.5, 11.6, 6.3, 11.6, "HTTP REST / WebSocket", '#1A4A9F')

# Backend → MongoDB
arrow(ax, 3.0, 10.0, 3.0, 9.4, "PyMongo  TCP :27017", '#B05A00')

# Backend → Qdrant
arrow(ax, 9.2, 10.0, 9.2, 9.4, "qdrant-client  :6333", '#3333AA')

# Backend → Ollama
arrow(ax, 16.0, 10.0, 16.0, 9.4, "HTTP POST  :11434", '#AA1177')

# Backend → Keycloak (dashed optional)
arrow(ax, 3.0, 10.0, 3.0, 5.1, "OIDC callback\n(optionnel)", '#888888', ls='--', lw=1.3)

# ═══════════════════════════════════════════════════════════════════════════
# LEGEND
# ═══════════════════════════════════════════════════════════════════════════
lx, ly = 6.8, 4.6
ax.add_patch(FancyBboxPatch((lx, ly-2.6), 5.8, 3.0,
    boxstyle="round,pad=0.15", lw=1,
    edgecolor='#AAAAAA', facecolor='#FDFDFD', zorder=1))
ax.text(lx+2.9, ly+0.2, "Légende", ha='center',
        fontsize=9, fontweight='bold', color='#333333')

items = [
    ('#E8F4FF', '#1A4A9F', "Tier 1 — Client  (Navigateur Web)"),
    ('#EAFAEA', '#1A6E1A', "Tier 2 — Application  (FastAPI)"),
    ('#FFF8E8', '#B05A00', "Tier 3 — Base de données  (MongoDB)"),
    ('#E4E4F8', '#5555CC', "Tier 4 — Vectoriel  (Qdrant / Docker)"),
    ('#FFF0FB', '#AA1177', "Tier 5 — IA / LLM  (Ollama)"),
    ('#F5F5F5', '#888888', "Tier 6 — Auth OIDC  (Keycloak)"),
]
for i, (fc, ec, lbl) in enumerate(items):
    yi = ly - 0.1 - i*0.42
    ax.add_patch(FancyBboxPatch((lx+0.25, yi-0.14), 0.42, 0.3,
        boxstyle="round,pad=0.02", lw=1.2,
        edgecolor=ec, facecolor=fc, zorder=3))
    ax.text(lx+0.85, yi+0.01, lbl, fontsize=7.8, va='center', color='#222222')

# ═══════════════════════════════════════════════════════════════════════════
# PORT SUMMARY BAR
# ═══════════════════════════════════════════════════════════════════════════
ax.add_patch(FancyBboxPatch((0.5, 1.55), 19.0, 0.55,
    boxstyle="round,pad=0.08", lw=1,
    edgecolor='#AABBCC', facecolor='#E8EEF4', zorder=1))
ax.text(10, 1.85,
    "Ports :  Frontend :5173   |   Backend :8000   |   "
    "MongoDB :27017   |   Qdrant :6333  (Docker)   |   "
    "Ollama :11434   |   Keycloak :8080  (opt.)",
    ha='center', va='center', fontsize=8, color='#334455')

plt.tight_layout(pad=0.3)
plt.savefig('/home/salsabil/finance_rag_project/deployment_diagram.png',
            dpi=150, bbox_inches='tight', facecolor='#F4F6F9')
print("Done!")
