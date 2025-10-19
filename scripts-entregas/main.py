"""Main script to generate all charts from CSV data files."""

from pathlib import Path
from generate_velocity_chart import generate_velocity_chart
from generate_business_value_chart import generate_business_value_chart
from generate_release_burndown_chart import generate_release_burndown_chart
from update_business_value import update_business_value_data
from generate_report import generate_report


def main():
    """Generate all charts from CSV files."""

    # Define paths
    data_dir = Path("data")
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)

    print("=" * 60)
    print("Generating Charts from CSV Data")
    print("=" * 60)
    print()

    # Step 1: Update business value data from completed stories
    print("Step 1: Calculating Business Value from Completed Stories...")
    print("-" * 60)
    try:
        update_business_value_data(verbose=False)
    except FileNotFoundError:
        print(
            "⚠️  Warning: completed_stories.csv not found, skipping business value update"
        )
    except Exception as e:
        print(f"⚠️  Warning: Could not update business value data: {e}")

    print()
    print("Step 2: Generating Charts...")
    print("-" * 60)
    print()

    # Generate Velocity Chart
    print("Generating Velocity Time Chart...")
    generate_velocity_chart(
        str(data_dir / "velocity_data.csv"), str(output_dir / "velocity_chart.png")
    )
    print("✓ Velocity chart saved to output/velocity_chart.png\n")

    # Generate Business Value Chart
    print("Generating Business Value Chart...")
    generate_business_value_chart(
        str(data_dir / "business_value_data.csv"),
        str(output_dir / "business_value_chart.png"),
    )
    print("✓ Business value chart saved to output/business_value_chart.png\n")

    # Generate Release Burndown Chart
    print("Generating Release Burndown Chart...")
    generate_release_burndown_chart(
        str(data_dir / "release_burndown_data.csv"),
        str(output_dir / "release_burndown_chart.png"),
    )
    print("✓ Release burndown chart saved to output/release_burndown_chart.png\n")

    # Generate markdown report
    print()
    print("Generating markdown report...")
    try:
        generate_report()
        print("✓ Markdown report saved to CHARTS.md")
    except Exception as e:
        print(f"⚠️  Warning: Could not generate report: {e}")

    print()
    print("=" * 60)
    print("All charts generated successfully!")
    print("=" * 60)
    print()
    print("📄 View report: scripts-entregas/CHARTS.md")


if __name__ == "__main__":
    main()
