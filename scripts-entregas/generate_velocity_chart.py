"""Generate Velocity Time Chart.

Describes the amount of work completed per week.
Compares planned story points vs actual completed story points at the end of the week.
"""

import csv
import matplotlib.pyplot as plt
import numpy as np


def generate_velocity_chart(csv_path: str, output_path: str):
    """
    Generate a velocity time chart showing planned vs actual story points per sprint/week.

    Args:
        csv_path: Path to CSV file with columns: week, date, planned_points, actual_points
        output_path: Path where the chart image will be saved
    """
    # Read CSV file
    sprint_names = []
    planned_points = []
    actual_points = []

    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip rows with empty data
            if not row["date"] or not row["date"].strip():
                continue

            sprint_names.append(row["week"])
            planned_points.append(
                float(row["planned_points"]) if row["planned_points"] else 0
            )
            actual_points.append(
                float(row["actual_points"]) if row["actual_points"] else 0
            )

    # If no data yet, skip chart generation
    if not sprint_names:
        print("⚠️  No velocity data available yet. Fill in the CSV file first.")
        return

    # Set up the plot
    fig, ax = plt.subplots(figsize=(12, 6))

    # Set up bar positions
    x = np.arange(len(sprint_names))
    width = 0.35

    # Create bars
    bars1 = ax.bar(
        x - width / 2,
        planned_points,
        width,
        label="Planeado",
        color="#5B9BD5",
        edgecolor="black",
        linewidth=0.5,
    )
    bars2 = ax.bar(
        x + width / 2,
        actual_points,
        width,
        label="Real",
        color="#7030A0",
        edgecolor="black",
        linewidth=0.5,
    )

    # Customize chart
    ax.set_xlabel("", fontsize=12)
    ax.set_ylabel("Puntos de historia", fontsize=12)
    ax.set_title("Velocity time chart", fontsize=16, fontweight="bold", pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(sprint_names)
    ax.legend(loc="upper right", fontsize=11)
    ax.grid(axis="y", alpha=0.3, linestyle="--")

    # Set y-axis to start at 0
    ax.set_ylim(bottom=0)

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
    generate_velocity_chart("data/velocity_data.csv", "output/velocity_chart.png")
    print("Chart generated successfully!")
