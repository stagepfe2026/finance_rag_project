import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(20, 13))
ax.set_xlim(0, 20)
ax.set_ylim(0, 13)
ax.axis('off')
fig.patch.set_facecolor('#F7F9FC')

# ── Helpers ───────────────────────────────────────────────────────────────────
def box(ax, x, y, w, h, fc, ec, r=0.25, lw=2.0, z=2, alpha=1.0):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
        boxstyle=f"round,pad=0.05,rounding_size={r}",
        lw=lw, edgecolor=ec, facecolor=fc, zorder=z, alpha=alpha))

def section(ax, x, y, w, h, fc, ec, title):
    # shadow
    ax.add_patch(FancyBboxPatch((x+0.07, y-0.07), w, h,
        boxstyle="round,pad=0.05,rounding_size=0.25",
        lw=0, facecolor='#CCCCCC', zorder=1, alpha=0.4))
    box(ax, x, y, w, h, fc, ec, r=0.25, lw=2.2, z=2)
    # title bar
    box(ax, x, y+h-0.52, w, 0.52, ec, ec, r=0.22, lw=0, z=3)
    ax.text(x+w/2, y+h-0.26, title, ha='center', va='center',
            fontsize=10, fontweight='bold', color='white', zorder=4)

def chip(ax, x, y, w, h, label, sublabel=None, fc='#FFFFFF',
         ec='#AAAAAA', tc='#222222', z=5):
    box(ax, x, y, w, h, fc, ec, r=0.15, lw=1.5, z=z)
    cy = y + h/2 + (0.1 if sublabel else 0)
    ax.text(x+w/2, cy, label, ha='center', va='center',
            fontsize=8.5, fontweight='bold', color=tc, zorder=z+1)
    if sublabel:
        ax.text(x+w/2, y+0.2, sublabel, ha='center', va='center',
                fontsize=6.8, color='#667788', zorder=z+1)

def arrow(ax, x1, y1, x2, y2, color='#5588AA', lbl='', lw=2.0, ls='-'):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
        arrowprops=dict(arrowstyle='->', color=color, lw=lw,
                        linestyle=ls),
        zorder=8)
    if lbl:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my, lbl, ha='center', va='center',
                fontsize=6.8, color=color, fontweight='bold', zorder=9,
                bbox=dict(boxstyle='round,pad=0.25', fc='white',
                          ec=color, lw=0.8, alpha=0.95))

def user_icon(ax, x, y, label, sublabel):
    # circle head
    ax.add_patch(Circle((x, y+0.55), 0.22, color='#1A6BC4', zorder=5))
    # body
    ax.add_patch(FancyBboxPatch((x-0.22, y+0.05), 0.44, 0.42,
        boxstyle="round,pad=0.02,rounding_size=0.1",
        lw=0, facecolor='#1A6BC4', zorder=5))
    ax.text(x, y-0.05, label, ha='center', va='top',
            fontsize=8, fontweight='bold', color='#1A2E4A', zorder=6)
    ax.text(x, y-0.35, sublabel, ha='center', va='top',
            fontsize=6.8, color='#667788', zorder=6)

# ══════════════════════════════════════════════════════════════════════════════
# TITLE BAR
# ══════════════════════════════════════════════════════════════════════════════
box(ax, 0.3, 12.15, 19.4, 0.7, '#1A2E4A', '#1A2E4A', r=0.2, z=1)
ax.text(10, 12.52, "Architecture Fonctionnelle — Plateforme Finance RAG",
        ha='center', va='center', fontsize=15,
        fontweight='bold', color='white', zorder=2)

# ══════════════════════════════════════════════════════════════════════════════
# ZONE 1 — UTILISATEURS
# ══════════════════════════════════════════════════════════════════════════════
section(ax, 0.3, 8.5, 2.7, 3.4, '#EBF5FF', '#1A6BC4', 'Utilisateurs')
user_icon(ax, 1.65, 10.6, 'Administrateur', 'Gestion & Audits')
user_icon(ax, 1.65, 9.1,  'Utilisateur Finance', 'Chat & Réclamations')

# ══════════════════════════════════════════════════════════════════════════════
# ZONE 2 — INTERFACE UTILISATEUR
# ══════════════════════════════════════════════════════════════════════════════
section(ax, 3.4, 8.5, 5.4, 3.4, '#E8F8F5', '#1A9E7A', 'Interface Utilisateur')
chip(ax, 3.65, 10.5, 2.4, 1.1, 'React 19', 'TypeScript + Vite',
     fc='#C8F0E4', ec='#1A9E7A', tc='#0E6E53')
chip(ax, 6.2,  10.5, 2.4, 1.1, 'Tailwind CSS', 'UI Components',
     fc='#C8F0E4', ec='#1A9E7A', tc='#0E6E53')
chip(ax, 3.65, 9.1,  2.4, 1.1, 'Authentification', 'Sessions + CSRF',
     fc='#C8F0E4', ec='#1A9E7A', tc='#0E6E53')
chip(ax, 6.2,  9.1,  2.4, 1.1, 'Chat RAG', 'Notifications WS',
     fc='#C8F0E4', ec='#1A9E7A', tc='#0E6E53')

# ══════════════════════════════════════════════════════════════════════════════
# ZONE 3 — BACKEND
# ══════════════════════════════════════════════════════════════════════════════
section(ax, 3.4, 5.1, 5.4, 3.1, '#FFF3E0', '#E67E22', 'Backend — FastAPI :8000')
chip(ax, 3.65, 7.1, 2.4, 0.9, 'FastAPI + Uvicorn', 'API REST / Python 3.12',
     fc='#FFE0B0', ec='#E67E22', tc='#7D3C00')
chip(ax, 6.2,  7.1, 2.4, 0.9, 'Auth & Sessions', 'Cookies HttpOnly',
     fc='#FFE0B0', ec='#E67E22', tc='#7D3C00')
chip(ax, 3.65, 5.9, 2.4, 0.9, 'Documents & Audits', 'Notifications',
     fc='#FFE0B0', ec='#E67E22', tc='#7D3C00')
chip(ax, 6.2,  5.9, 2.4, 0.9, 'Reclamations', 'Stockage Fichiers',
     fc='#FFE0B0', ec='#E67E22', tc='#7D3C00')

# ══════════════════════════════════════════════════════════════════════════════
# ZONE 4 — PIPELINE RAG
# ══════════════════════════════════════════════════════════════════════════════
section(ax, 3.4, 1.4, 5.4, 3.4, '#F3E5F5', '#8E44AD', 'Pipeline RAG / NLP')
chip(ax, 3.65, 3.7, 1.55, 0.9, 'Extraction', 'PDF / Word',
     fc='#E8D5F5', ec='#8E44AD', tc='#5B2C6F')
chip(ax, 5.35, 3.7, 1.55, 0.9, 'Chunking', 'size:120 ov:20',
     fc='#E8D5F5', ec='#8E44AD', tc='#5B2C6F')
chip(ax, 7.05, 3.7, 1.55, 0.9, 'Retrieval', 'BM25 + Vectors',
     fc='#E8D5F5', ec='#8E44AD', tc='#5B2C6F')
chip(ax, 3.65, 2.5, 2.4, 0.9, 'Reranker', 'Score hybride RRF',
     fc='#E8D5F5', ec='#8E44AD', tc='#5B2C6F')
chip(ax, 6.2,  2.5, 2.4, 0.9, 'Prompt Builder', 'Contexte + Question',
     fc='#E8D5F5', ec='#8E44AD', tc='#5B2C6F')
chip(ax, 3.65, 1.65, 4.9, 0.6, 'Spacy fr_core_news_md — NLP Francais',
     fc='#EDE0F8', ec='#8E44AD', tc='#5B2C6F')

# ══════════════════════════════════════════════════════════════════════════════
# ZONE 5 — DONNÉES
# ══════════════════════════════════════════════════════════════════════════════
section(ax, 9.6, 6.3, 5.0, 5.6, '#FFF8E1', '#F39C12', 'Tiers Donnees')

# MongoDB
box(ax, 9.85, 9.8, 4.5, 1.85, '#FFF0C0', '#F39C12', r=0.2, lw=1.5, z=4)
ax.text(12.1, 11.5, 'MongoDB  —  :27017', ha='center',
        fontsize=9, fontweight='bold', color='#7D5000', zorder=5)
ax.text(12.1, 11.05,
        'users  ·  sessions  ·  documents  ·  chats',
        ha='center', fontsize=7.5, color='#555522', zorder=5)
ax.text(12.1, 10.65,
        'reclamations  ·  notifications  ·  audits',
        ha='center', fontsize=7.5, color='#555522', zorder=5)

# Qdrant + Docker
box(ax, 9.85, 7.65, 4.5, 1.9, '#FFF0C0', '#F39C12', r=0.2, lw=1.5, z=4)
ax.text(12.1, 9.4, 'Qdrant  —  :6333', ha='center',
        fontsize=9, fontweight='bold', color='#7D5000', zorder=5)
chip(ax, 9.9, 8.6, 1.6, 0.55, 'Docker', 'Execution env.',
     fc='#D6EAF8', ec='#2980B9', tc='#1A5276', z=6)
ax.text(12.1, 8.85,
        'Embeddings vectoriels  1024-dim',
        ha='center', fontsize=7.5, color='#555522', zorder=5)
ax.text(12.1, 8.55,
        'Recherche cosine similarity',
        ha='center', fontsize=7.5, color='#555522', zorder=5)

chip(ax, 9.85, 6.55, 4.5, 0.8, 'Systeme de Fichiers Local',
     'storage/documents  |  storage/reclamations',
     fc='#FFF8DC', ec='#F39C12', tc='#7D5000', z=4)

# ══════════════════════════════════════════════════════════════════════════════
# ZONE 6 — LLM LOCAL
# ══════════════════════════════════════════════════════════════════════════════
section(ax, 9.6, 1.4, 5.0, 4.6, '#FDEDEC', '#C0392B', 'Tiers IA / LLM Local')

chip(ax, 9.85, 4.5, 4.5, 1.0, 'Ollama  —  :11434',
     'Gestionnaire de modeles IA locaux',
     fc='#F5B7B1', ec='#C0392B', tc='#7B241C', z=5)

chip(ax, 9.85, 3.2, 2.1, 1.0, 'llama3:latest',
     'Generation reponses',
     fc='#FADBD8', ec='#C0392B', tc='#7B241C', z=5)
chip(ax, 12.2, 3.2, 2.1, 1.0, 'mxbai-embed-large',
     'Embeddings 1024-dim',
     fc='#FADBD8', ec='#C0392B', tc='#7B241C', z=5)

box(ax, 9.85, 1.65, 4.5, 1.25, '#FDECEA', '#C0392B', r=0.15, lw=1.2, z=4)
ax.text(12.1, 2.55, 'Execution 100% Locale', ha='center',
        fontsize=8.5, fontweight='bold', color='#7B241C', zorder=5)
ax.text(12.1, 2.15,
        'Confidentialite des donnees financieres',
        ha='center', fontsize=7.5, color='#922B21', zorder=5)
ax.text(12.1, 1.82,
        'Aucun appel vers des services externes',
        ha='center', fontsize=7.5, color='#922B21', zorder=5)

# ══════════════════════════════════════════════════════════════════════════════
# ARROWS
# ══════════════════════════════════════════════════════════════════════════════
arrow(ax, 3.0,  10.4, 3.4, 10.4, '#1A6BC4', 'Requetes')
arrow(ax, 6.1,  8.5,  6.1, 8.2,  '#1A9E7A', 'HTTP REST\nWebSocket')
arrow(ax, 6.1,  5.1,  6.1, 4.8,  '#E67E22', 'Question\n+ Docs')
arrow(ax, 8.8,  3.2,  9.6, 3.5,  '#8E44AD', 'Prompt\nconstruit')
arrow(ax, 8.8,  4.0,  9.6, 8.5,  '#8E44AD', 'Recherche\nvectorielle', lw=1.5)
arrow(ax, 8.8,  6.5,  9.6, 10.5, '#E67E22', 'PyMongo\nCRUD', lw=1.5)
arrow(ax, 9.6,  4.8,  8.8, 5.5,  '#C0392B', 'Reponse\ngeneree', lw=2.0)

# ══════════════════════════════════════════════════════════════════════════════
# FOOTER
# ══════════════════════════════════════════════════════════════════════════════
box(ax, 0.3, 0.15, 19.4, 0.55, '#EAECEE', '#CCCCCC', r=0.15, lw=1.0, z=1)
ax.text(10, 0.44,
    'Stack : React 19  |  FastAPI  |  MongoDB :27017  |  '
    'Qdrant :6333 (Docker)  |  Ollama :11434  |  '
    'llama3:latest  |  mxbai-embed-large  |  Python 3.12  |  TypeScript',
    ha='center', va='center', fontsize=7.5, color='#445566')

plt.tight_layout(pad=0.1)
plt.savefig('/home/salsabil/finance_rag_project/architecture_diagram.png',
            dpi=150, bbox_inches='tight', facecolor='#F7F9FC')
print("Done!")
