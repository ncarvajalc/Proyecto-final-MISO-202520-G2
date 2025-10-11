"""
Update business_value_data.csv based on daily completed stories.

This script reads:
- data/story_business_values.csv (story codes and their business values)
- data/completed_stories.csv (which stories were completed each day)

And generates:
- data/business_value_data.csv (daily cumulative value points for the chart)
"""

import csv
from datetime import datetime
from collections import defaultdict


def load_story_values():
    """Load story business values from story_business_values.csv"""
    story_values = {}

    with open("data/story_business_values.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row["code"]
            value = float(row["business_value"])
            story_values[code] = value

    return story_values


def update_business_value_data(verbose=True):
    """Generate business_value_data.csv from completed_stories.csv

    Args:
        verbose: If True, print detailed output. If False, print minimal output.
    """

    # Load story values
    story_values = load_story_values()

    if verbose:
        print("=" * 70)
        print("Business Value Calculator (Daily Tracking)")
        print("=" * 70)
        print()

    # Group stories by date
    stories_by_date = defaultdict(list)

    with open("data/completed_stories.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            date = row["date"].strip()
            story_code = row["story_codes"].strip()
            week = row["week"].strip()

            if date and story_code:
                stories_by_date[date].append((story_code, week))

    # Sort dates chronologically
    sorted_dates = sorted(stories_by_date.keys())

    # Process each date and calculate cumulative value
    output_rows = []
    cumulative_value = 0
    stories_by_week = defaultdict(list)

    for date in sorted_dates:
        stories = stories_by_date[date]

        for story_code, week in stories:
            if story_code in story_values:
                value = story_values[story_code]
                cumulative_value += value
                stories_by_week[week].append((story_code, value))

                # Add a data point for this story completion
                output_rows.append(
                    {
                        "date": date,
                        "cumulative_value": round(cumulative_value, 2),
                        "week": week,
                    }
                )
            else:
                print(
                    f"⚠️  Warning: Story {story_code} not found in story_business_values.csv"
                )

    # Print summary by week
    if verbose:
        for week in sorted(set(row["week"] for row in output_rows)):
            week_stories = stories_by_week[week]
            if week_stories:
                print(f"📅 {week}:")
                for story_code, value in week_stories:
                    print(f"   ✓ {story_code} (+{value} points)")
                week_total = sum(v for _, v in week_stories)
                print(f"   Week Total: {week_total} points")
                print()

    # Write output file
    with open("data/business_value_data.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["date", "cumulative_value", "week"])
        writer.writeheader()
        writer.writerows(output_rows)

    if verbose:
        print("=" * 70)
        print(f"✅ Total Business Value Delivered: {cumulative_value} / 100 points")
        print(f"📊 Progress: {cumulative_value}%")
        print(f"📈 Data Points: {len(output_rows)} story completions")
        print("=" * 70)
        print()
        print("✓ business_value_data.csv has been updated!")
        print()
        print("Next steps:")
        print("1. Edit data/completed_stories.csv to add more completed stories")
        print("   Format: date,story_codes,week")
        print("   Example: 2025-10-07,HUP-002,Semana 1")
        print("2. Run this script again: python update_business_value.py")
        print("3. Generate charts: python main.py")
    else:
        # Compact output when called from main.py
        print(
            f"   ✓ Business value updated: {cumulative_value}/100 points ({len(output_rows)} stories)"
        )

    return cumulative_value, len(output_rows)


if __name__ == "__main__":
    try:
        update_business_value_data()
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        print()
        print("Make sure you have these files:")
        print("  - data/story_business_values.csv")
        print("  - data/completed_stories.csv")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()
