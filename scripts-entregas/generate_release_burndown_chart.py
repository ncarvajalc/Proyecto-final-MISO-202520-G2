"""Generate Release Burndown Chart.

Updated at the end of each sprint.
The horizontal axis represents the Sprint.
The vertical axis represents the amount of story points remaining at the start of the sprint.
"""

import csv
import matplotlib.pyplot as plt
import numpy as np


def generate_release_burndown_chart(csv_path: str, output_path: str):
    """
    Generate a release burndown chart showing remaining story points per sprint.

    Args:
        csv_path: Path to CSV file with columns: sprint, date, remaining_points
        output_path: Path where the chart image will be saved
    """
    # Read CSV file
    sprint_names = []
    remaining_points = []
    initial_points = None

    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip rows with empty data
            if not row["date"] or not row["date"].strip():
                continue

            sprint_names.append(row["sprint"])
            points = int(row["remaining_points"]) if row["remaining_points"] else 0
            remaining_points.append(points)

            # First row's remaining_points is the initial_points
            if initial_points is None:
                initial_points = points

    # If no data yet, skip chart generation
    if not sprint_names:
        print("⚠️  No release burndown data available yet. Fill in the CSV file first.")
        return

    # If initial_points is still None, set a default
    if initial_points is None:
        initial_points = 100

    # Calculate ideal burndown line
    num_sprints = len(sprint_names)
    ideal_burndown = np.linspace(initial_points, 0, num_sprints)

    # Set up the plot
    fig, ax = plt.subplots(figsize=(12, 6))

    # Create ideal burndown line
    ax.plot(
        sprint_names,
        ideal_burndown,
        color="#CCCCCC",
        linewidth=2,
        linestyle="-",
        alpha=0.7,
        zorder=1,
    )

    # Create scatter plot for actual remaining points
    colors = []
    for i, points in enumerate(remaining_points):
        # Color green if on track or ahead, red if behind
        if points <= ideal_burndown[i]:
            colors.append("#70AD47")  # Green
        else:
            colors.append("#C00000")  # Red

    ax.scatter(
        sprint_names,
        remaining_points,
        s=300,
        c=colors,
        edgecolors="black",
        linewidth=1.5,
        zorder=3,
        alpha=0.8,
    )

    # Customize chart
    ax.set_xlabel("", fontsize=12)
    ax.set_ylabel("Puntos de historia", fontsize=12)
    ax.set_title("Release Burndown chart", fontsize=16, fontweight="bold", pad=20)
    ax.grid(axis="both", alpha=0.3, linestyle="--")

    # Set y-axis to start at 0
    ax.set_ylim(bottom=0, top=initial_points * 1.1)

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
    generate_release_burndown_chart(
        "data/release_burndown_data.csv", "output/release_burndown_chart.png"
    )
    print("Chart generated successfully!")
