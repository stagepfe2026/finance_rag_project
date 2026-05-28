import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.lines import Line2D

dates = [
    '02/03', '03/03', '04/03', '05/03', '06/03', '07/03', '08/03',
    '09/03', '10/03', '11/03', '12/03', '13/03', '14/03', '15/03',
    '16/03', '17/03', '18/03', '19/03', '20/03', '21/03', '22/03'
]

# Ideal: linear 87 → 0 over 20 intervals
ideal = [round(87 - 87 / 20 * i, 2) for i in range(21)]

# Real: slow start, accelerates in second half, finishes at 0
real = [87, 85, 81, 76, 73, 69, 64, 59, 50, 43, 36, 29, 25, 21, 17, 13, 9, 5, 3, 1, 0]

x = list(range(len(dates)))

BG = '#111111'
BLUE = '#5b9bd5'
GREEN = '#70ad47'
GRID = '#2a2a2a'

fig, ax = plt.subplots(figsize=(13, 6))
fig.patch.set_facecolor(BG)
ax.set_facecolor(BG)

ax.plot(x, ideal, color=BLUE, linewidth=2.2, solid_capstyle='round', solid_joinstyle='round', zorder=3)
ax.plot(x, real,  color=GREEN, linewidth=2.2, solid_capstyle='round', solid_joinstyle='round', zorder=3)

# Horizontal dashed grid only
for y_val in [0, 25, 50, 75, 100]:
    ax.axhline(y=y_val, color='#3a3a3a', linewidth=0.8, linestyle='--', zorder=1)

ax.set_ylim(-2, 105)
ax.set_xlim(-0.3, len(dates) - 0.7)

# X-axis: every 2 days
tick_pos = list(range(0, len(dates), 2))
ax.set_xticks(tick_pos)
ax.set_xticklabels([dates[i] for i in tick_pos], color='white', fontsize=10)

# Y-axis
ax.set_yticks([0, 25, 50, 75, 100])
ax.set_yticklabels(['0', '25', '50', '75', '100'], color='white', fontsize=10)

# Remove all spines and ticks
for spine in ax.spines.values():
    spine.set_visible(False)
ax.tick_params(axis='both', which='both', length=0)

# Legend centered at bottom (dots only, no line)
legend_elements = [
    Line2D([0], [0], marker='o', color='none', markerfacecolor=BLUE,
           markeredgecolor='none', markersize=9, label='Burndown idéal'),
    Line2D([0], [0], marker='o', color='none', markerfacecolor=GREEN,
           markeredgecolor='none', markersize=9, label='Burndown réel'),
]
legend = ax.legend(
    handles=legend_elements,
    loc='lower center',
    bbox_to_anchor=(0.5, -0.16),
    ncol=2,
    frameon=False,
    labelcolor='white',
    fontsize=11,
    handletextpad=0.4,
    columnspacing=1.5,
)

fig.text(0.01, 0.01, 'Style inspiré de Trello', color='#aaaaaa', fontsize=8)

plt.tight_layout(rect=[0, 0.06, 1, 1])

out_path = '/home/salsabil/finance_rag_project/diagrams/burndown_sprint2.png'
plt.savefig(out_path, dpi=150, bbox_inches='tight', facecolor=BG, edgecolor='none')
print(f'Saved: {out_path}')
