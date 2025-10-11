"""Generate Business Value Chart.

Describes the business value delivered to the organization.
Each user story has an assigned business value.
Each completed user story contributes that value.
At the start of Project II, each user story to implement must be assigned a value.
The total sum of these values is 100.

Shows a continuous line that increases each day a story is completed.
"""

import csv
import matplotlib.pyplot as plt
from datetime import datetime


def generate_business_value_chart(csv_path: str, output_path: str):
    """
    Generate a cumulative business value chart showing value delivered over time.

    Args:
        csv_path: Path to CSV file with columns: date, cumulative_value, week
        output_path: Path where the chart image will be saved
    """
    # Read CSV file
    dates = []
    cumulative_values = []
    weeks = []
    week_boundaries = []  # Track where weeks change

    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        last_week = None
        i = 0

        for row in reader:
            # Skip rows with empty data
            if not row["date"] or not row["date"].strip():
                continue

            dates.append(datetime.strptime(row["date"], "%Y-%m-%d"))
            cumulative_values.append(float(row["cumulative_value"]))
            current_week = row["week"]
            weeks.append(current_week)

            # Track week boundaries for vertical lines
            if last_week and last_week != current_week:
                week_boundaries.append(i - 1)
            last_week = current_week
            i += 1

    # If no data yet, skip chart generation
    if not dates:
        print("⚠️  No business value data available yet. Fill in the CSV file first.")
        return

    # Set up the plot
    fig, ax = plt.subplots(figsize=(14, 7))

    # Create continuous line chart with markers for each story completion
    x_positions = list(range(len(dates)))
    ax.plot(
        x_positions,
        cumulative_values,
        color="#404040",
        linewidth=2.5,
        marker="o",
        markersize=6,
        markerfacecolor="#404040",
        markeredgecolor="white",
        markeredgewidth=1.5,
    )

    # Add subtle vertical lines at week boundaries
    for boundary in week_boundaries:
        ax.axvline(
            x=boundary + 0.5, color="#CCCCCC", linestyle="--", linewidth=1, alpha=0.5
        )

    # Add target line at 100
    ax.axhline(
        y=100,
        color="#5B9BD5",
        linestyle="--",
        linewidth=2,
        alpha=0.7,
        label="Objetivo (100)",
    )

    # Customize chart
    ax.set_xlabel("Progreso del Proyecto", fontsize=12)
    ax.set_ylabel("Valor de negocio ganado", fontsize=12)
    ax.set_title("Business value chart", fontsize=16, fontweight="bold", pad=20)
    ax.grid(axis="y", alpha=0.3, linestyle="--")

    # Set y-axis limits
    max_value = max(cumulative_values) if cumulative_values else 0
    ax.set_ylim(bottom=0, top=max(105, max_value * 1.1))

    # Add week labels at approximate positions (no individual dates)
    unique_weeks = []
    week_positions = []
    seen = set()
    for i, week in enumerate(weeks):
        if week not in seen:
            unique_weeks.append(week)
            # Position label at the start of each week
            week_positions.append(i)
            seen.add(week)

    # Show week labels below the chart
    if unique_weeks:
        ax.set_xticks(week_positions)
        ax.set_xticklabels(unique_weeks, fontsize=10, rotation=0)
    else:
        ax.set_xticks([])

    # Add legend
    ax.legend(["Valor Acumulado", "Objetivo (100)"], loc="upper left", fontsize=11)

    # Add current value annotation
    if cumulative_values:
        final_value = cumulative_values[-1]
        ax.annotate(
            f"{final_value:.1f}",
            xy=(len(dates) - 1, final_value),
            xytext=(10, 0),
            textcoords="offset points",
            fontsize=11,
            fontweight="bold",
            color="#404040",
        )

    # Add some padding to the layout
    plt.tight_layout()

    # Save the figure
    plt.savefig(output_path, dpi=300, bbox_inches="tight", facecolor="white")
    plt.close()


if __name__ == "__main__":
    # Test with example data
    from pathlib import Path

    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)
    generate_business_value_chart(
        "data/business_value_data.csv", "output/business_value_chart.png"
    )
    print("Chart generated successfully!")
