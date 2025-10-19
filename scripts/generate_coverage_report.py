#!/usr/bin/env python3
"""
Generate consolidated coverage report from GitHub Actions artifacts.

This script processes coverage artifacts from both frontend and backend tests,
organized by test type (unit, functional, integration, acceptance, e2e),
and generates a comprehensive markdown report.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple


class CoverageReportGenerator:
    """Generates consolidated coverage reports from test artifacts."""

    def __init__(
        self,
        artifacts_dir: str = "coverage-artifacts",
        output_dir: str = "coverage_reports",
    ):
        self.artifacts_dir = Path(artifacts_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.services = [
            "base",
            "SecurityAndAudit",
            "Tracking",
            "Warehouse",
            "SalesForce",
            "PurchasesAndSuppliers",
        ]

        self.test_types = ["unit", "functional", "integration", "acceptance"]
        self.frontend_test_types = [
            "unit",
            "functional",
            "integration",
            "acceptance",
            "e2e",
        ]

    def read_coverage_summary(self, artifact_path: Path) -> float:
        """Read coverage percentage from summary file."""
        summary_file = artifact_path / "coverage-summary.txt"

        # Try different naming patterns
        if not summary_file.exists():
            for test_type in self.test_types + ["e2e"]:
                summary_file = artifact_path / f"coverage-summary-{test_type}.txt"
                if summary_file.exists():
                    break

        if summary_file.exists():
            try:
                content = summary_file.read_text().strip()
                return float(content)
            except (ValueError, FileNotFoundError):
                pass

        return None

    def read_backend_coverage(self, service: str, test_type: str) -> Dict:
        """Read coverage data for a backend service and test type."""
        artifact_name = f"coverage-{service}-{test_type}"
        artifact_path = self.artifacts_dir / artifact_name

        result = {"coverage": None, "status": "❌ Failed", "details": []}

        if not artifact_path.exists():
            return result

        # Read coverage percentage
        coverage = self.read_coverage_summary(artifact_path)
        if coverage is not None:
            result["coverage"] = coverage
            result["status"] = "✅ Passed" if coverage > 0 else "⚠️ No Coverage"

        # Read detailed coverage from JSON
        json_file = artifact_path / f"coverage-{test_type}.json"
        if json_file.exists():
            try:
                with open(json_file, "r") as f:
                    coverage_data = json.load(f)

                # Extract file-level coverage
                files = coverage_data.get("files", {})
                for file_path, file_data in files.items():
                    file_name = Path(file_path).name
                    file_coverage = file_data["summary"]["percent_covered"]
                    result["details"].append(
                        {"file": file_name, "coverage": file_coverage}
                    )
            except (json.JSONDecodeError, KeyError):
                pass

        return result

    def read_frontend_coverage(self, test_type: str) -> Dict:
        """Read coverage data for frontend test type."""
        artifact_name = f"coverage-frontend-{test_type}"
        artifact_path = self.artifacts_dir / artifact_name

        result = {"coverage": None, "status": "❌ Failed", "details": []}

        if not artifact_path.exists():
            return result

        # For E2E tests, just check if the artifact exists
        if test_type == "e2e":
            summary_file = artifact_path / "coverage-summary-e2e.txt"
            if summary_file.exists():
                result["status"] = "✅ Passed"
            return result

        # Read coverage percentage
        coverage = self.read_coverage_summary(artifact_path)
        if coverage is not None:
            result["coverage"] = coverage
            result["status"] = "✅ Passed" if coverage > 0 else "⚠️ No Coverage"

        # Read detailed coverage from JSON
        json_file = artifact_path / f"coverage-{test_type}" / "coverage-summary.json"
        if json_file.exists():
            try:
                with open(json_file, "r") as f:
                    coverage_data = json.load(f)

                # Extract file-level coverage
                for file_path, file_data in coverage_data.items():
                    if file_path != "total":
                        file_name = Path(file_path).name
                        file_coverage = file_data["lines"]["pct"]
                        result["details"].append(
                            {"file": file_name, "coverage": file_coverage}
                        )
            except (json.JSONDecodeError, KeyError):
                pass

        return result

    def generate_coverage_chart(self, coverage_by_type: Dict[str, float]) -> str:
        """Generate a simple ASCII bar chart for coverage."""
        if not coverage_by_type:
            return "No coverage data available"

        chart_lines = []
        max_label_len = max(len(label) for label in coverage_by_type.keys())

        for test_type, coverage in coverage_by_type.items():
            if coverage is None:
                bar = "N/A"
            else:
                bar_length = int(
                    coverage / 2
                )  # Scale to 50 chars max (100% = 50 chars)
                bar = "█" * bar_length
                bar += f" {coverage:.1f}%"

            label = test_type.capitalize().ljust(max_label_len)
            chart_lines.append(f"{label} | {bar}")

        return "\n".join(chart_lines)

    def generate_file_coverage_table(self, details: List[Dict], limit: int = 10) -> str:
        """Generate a markdown table showing file-level coverage."""
        if not details:
            return "_No detailed coverage data available_"

        # Sort by coverage (lowest first to highlight problem areas)
        sorted_details = sorted(details, key=lambda x: x["coverage"])[:limit]

        table = "| File | Coverage |\n"
        table += "|------|----------|\n"

        for item in sorted_details:
            coverage_bar = self.get_coverage_emoji(item["coverage"])
            table += f"| {item['file']} | {coverage_bar} {item['coverage']:.1f}% |\n"

        if len(details) > limit:
            table += f"\n_Showing {limit} files with lowest coverage (out of {len(details)} total)_\n"

        return table

    def get_coverage_emoji(self, coverage: float) -> str:
        """Get emoji indicator for coverage level."""
        if coverage >= 80:
            return "🟢"
        elif coverage >= 60:
            return "🟡"
        elif coverage >= 40:
            return "🟠"
        else:
            return "🔴"

    def generate_markdown_report(self) -> str:
        """Generate the main markdown report."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        report = [
            "# 📊 Test Coverage Report",
            "",
            f"**Generated:** {timestamp}",
            "",
            "This report shows code coverage for all test types across frontend and backend services.",
            "",
            "## 🎯 Coverage Summary",
            "",
        ]

        # Frontend Coverage
        report.extend(
            [
                "### Frontend (cliente_web)",
                "",
                "| Test Type | Coverage | Status |",
                "|-----------|----------|--------|",
            ]
        )

        frontend_coverage_by_type = {}
        for test_type in self.frontend_test_types:
            coverage_data = self.read_frontend_coverage(test_type)
            coverage = coverage_data["coverage"]
            status = coverage_data["status"]

            coverage_str = f"{coverage:.1f}%" if coverage is not None else "N/A"
            report.append(f"| {test_type.capitalize()} | {coverage_str} | {status} |")

            if coverage is not None:
                frontend_coverage_by_type[test_type] = coverage

        report.extend(
            [
                "",
                "#### Coverage Chart",
                "```",
                self.generate_coverage_chart(frontend_coverage_by_type),
                "```",
                "",
            ]
        )

        # Backend Coverage
        report.extend(["### Backend Microservices", ""])

        for service in self.services:
            report.extend(
                [
                    f"#### {service}",
                    "",
                    "| Test Type | Coverage | Status |",
                    "|-----------|----------|--------|",
                ]
            )

            service_coverage_by_type = {}
            for test_type in self.test_types:
                coverage_data = self.read_backend_coverage(service, test_type)
                coverage = coverage_data["coverage"]
                status = coverage_data["status"]

                coverage_str = f"{coverage:.1f}%" if coverage is not None else "N/A"
                report.append(
                    f"| {test_type.capitalize()} | {coverage_str} | {status} |"
                )

                if coverage is not None:
                    service_coverage_by_type[test_type] = coverage

            if service_coverage_by_type:
                report.extend(
                    [
                        "",
                        "**Coverage Chart:**",
                        "```",
                        self.generate_coverage_chart(service_coverage_by_type),
                        "```",
                        "",
                    ]
                )

            report.append("")

        # Detailed Coverage Section
        report.extend(
            [
                "## 📋 Detailed File Coverage",
                "",
                "### Frontend Files (Lowest Coverage)",
                "",
            ]
        )

        for test_type in self.frontend_test_types:
            if test_type == "e2e":
                continue
            coverage_data = self.read_frontend_coverage(test_type)
            if coverage_data["details"]:
                report.extend(
                    [
                        f"#### {test_type.capitalize()} Tests",
                        "",
                        self.generate_file_coverage_table(coverage_data["details"]),
                        "",
                    ]
                )

        report.extend(["### Backend Files (Lowest Coverage)", ""])

        for service in self.services:
            for test_type in self.test_types:
                coverage_data = self.read_backend_coverage(service, test_type)
                if coverage_data["details"]:
                    report.extend(
                        [
                            f"#### {service} - {test_type.capitalize()} Tests",
                            "",
                            self.generate_file_coverage_table(
                                coverage_data["details"], limit=5
                            ),
                            "",
                        ]
                    )

        # Footer
        report.extend(
            [
                "---",
                "",
                "**Legend:**",
                "- 🟢 >= 80% coverage",
                "- 🟡 60-79% coverage",
                "- 🟠 40-59% coverage",
                "- 🔴 < 40% coverage",
                "",
                "_Generated by automated coverage reporting system_",
            ]
        )

        return "\n".join(report)

    def generate_report(self):
        """Generate and save the coverage report."""
        print("🔍 Scanning coverage artifacts...")

        if not self.artifacts_dir.exists():
            print(f"⚠️  Artifacts directory not found: {self.artifacts_dir}")
            print("Creating empty report...")

        print("📝 Generating markdown report...")
        markdown_report = self.generate_markdown_report()

        report_path = self.output_dir / "COVERAGE_REPORT.md"
        report_path.write_text(markdown_report)

        print(f"✅ Report generated: {report_path}")

        # Also generate a simple JSON summary
        self.generate_json_summary()

    def generate_json_summary(self):
        """Generate a JSON summary of all coverage data."""
        summary = {
            "timestamp": datetime.now().isoformat(),
            "frontend": {},
            "backend": {},
        }

        # Frontend summary
        for test_type in self.frontend_test_types:
            coverage_data = self.read_frontend_coverage(test_type)
            summary["frontend"][test_type] = {
                "coverage": coverage_data["coverage"],
                "status": coverage_data["status"],
            }

        # Backend summary
        for service in self.services:
            summary["backend"][service] = {}
            for test_type in self.test_types:
                coverage_data = self.read_backend_coverage(service, test_type)
                summary["backend"][service][test_type] = {
                    "coverage": coverage_data["coverage"],
                    "status": coverage_data["status"],
                }

        json_path = self.output_dir / "coverage_summary.json"
        with open(json_path, "w") as f:
            json.dump(summary, f, indent=2)

        print(f"✅ JSON summary generated: {json_path}")


def main():
    """Main entry point."""
    generator = CoverageReportGenerator()
    generator.generate_report()


if __name__ == "__main__":
    main()
