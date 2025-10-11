"""Generate a markdown report with all charts embedded."""

import csv
from datetime import datetime
from pathlib import Path


def get_business_value_summary():
    """Get summary of business value progress."""
    try:
        with open("data/business_value_data.csv", "r") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            if rows:
                last_row = rows[-1]
                total_value = float(last_row["cumulative_value"])
                num_stories = len(rows)
                return total_value, num_stories
    except Exception:
        pass
    return 0, 0


def get_velocity_summary():
    """Get summary of velocity data."""
    try:
        total_planned = 0
        total_actual = 0
        weeks_with_data = 0

        with open("data/velocity_data.csv", "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("date") and row["date"].strip():
                    weeks_with_data += 1
                    total_planned += float(row.get("planned_points", 0) or 0)
                    total_actual += float(row.get("actual_points", 0) or 0)

        avg_velocity = total_actual / weeks_with_data if weeks_with_data > 0 else 0
        return weeks_with_data, total_planned, total_actual, avg_velocity
    except Exception:
        pass
    return 0, 0, 0, 0


def get_burndown_summary():
    """Get summary of release burndown."""
    try:
        with open("data/release_burndown_data.csv", "r") as f:
            reader = csv.DictReader(f)
            rows = [row for row in reader if row.get("date") and row["date"].strip()]
            if rows:
                initial = float(rows[0]["remaining_points"])
                current = float(rows[-1]["remaining_points"])
                sprints = len(rows)
                return initial, current, sprints
    except Exception:
        pass
    return 0, 0, 0


def get_completed_stories():
    """Get list of completed stories."""
    stories = []
    try:
        with open("data/completed_stories.csv", "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("date") and row["date"].strip():
                    stories.append(
                        {
                            "date": row["date"],
                            "code": row["story_codes"],
                            "week": row["week"],
                        }
                    )
    except Exception:
        pass
    return stories


def generate_report():
    """Generate the markdown report."""

    # Get summaries
    bv_total, bv_stories = get_business_value_summary()
    vel_weeks, vel_planned, vel_actual, vel_avg = get_velocity_summary()
    bd_initial, bd_current, bd_sprints = get_burndown_summary()
    completed_stories = get_completed_stories()

    # Generate timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    # Create markdown content
    md_content = f"""# Gráficas del proyecto no generadas por Jira - Proyecto Final MISO 202520 G2

**Última actualización:** {timestamp}

## Resumen de métricas del proyecto

### Business value chart
- **Valor total:** {bv_total:.1f} / 100 puntos ({bv_total:.0f}%)
- **Historias completadas:** {bv_stories}
- **Valor restante:** {100 - bv_total:.1f} puntos

### Velocity chart
- **Semanas registradas:** {vel_weeks}
- **Total planeado:** {vel_planned:.1f} puntos de historia
- **Total completado:** {vel_actual:.1f} puntos de historia
- **Velocidad promedio:** {vel_avg:.1f} puntos/semana

### Release burndown chart
- **Alcance inicial:** {bd_initial:.0f} puntos de historia
- **Restante:** {bd_current:.0f} puntos de historia
- **Completado:** {bd_initial - bd_current:.0f} puntos de historia
- **Sprints registrados:** {bd_sprints}

---

## Velocity time chart

Compara los puntos de historia planeados vs completados por semana.

![Gráfica de velocidad](output/velocity_chart.png)

**Información clave:**
- Muestra el rendimiento semanal comparando la entrega planeada vs real
- Ayuda a identificar la capacidad del equipo y la precisión de la planeación
- Las barras moradas indican los puntos realmente entregados

---

## Gráfica de valor de negocio

Valor de negocio acumulado entregado a lo largo del tiempo (objetivo: 100 puntos).

![Gráfica de valor de negocio](output/business_value_chart.png)

**Información clave:**
- Cada punto representa una historia completada
- La línea muestra el progreso acumulado hacia los 100 puntos totales
- Las líneas verticales punteadas separan las semanas

---

## Release burndown chart

Puntos de historia restantes al inicio de cada sprint vs burndown ideal.

![Gráfica de burndown del release](output/release_burndown_chart.png)

**Información clave:**
- Puntos verdes: puntos restantes al inicio del sprint
- Línea gris: trayectoria seguida

---

## Historias completadas

"""

    # Add completed stories by week
    if completed_stories:
        stories_by_week = {}
        for story in completed_stories:
            week = story["week"]
            if week not in stories_by_week:
                stories_by_week[week] = []
            stories_by_week[week].append(story)

        for week in sorted(stories_by_week.keys()):
            md_content += f"\n### {week}\n\n"
            for story in stories_by_week[week]:
                md_content += f"- **{story['code']}** - {story['date']}\n"
    else:
        md_content += "\n*No hay historias completadas aún.*\n"

    md_content += f"""

---

## Cómo actualizar

Este reporte se genera automáticamente cuando haces push a las ramas `develop` o `main`.

Para actualizar las gráficas:

1. Edita los archivos de datos en `scripts-entregas/data/`:
   - `completed_stories.csv` - Agrega historias completadas con fechas
   - `velocity_data.csv` - Actualiza los datos de velocidad semanales
   - `release_burndown_data.csv` - Actualiza los datos de burndown por sprint

2. Haz push a `develop` o `main`:
   ```bash
   git add scripts-entregas/data/
   git commit -m "actualizar: agregar historias completadas"
   git push
   ```

3. GitHub Actions automáticamente:
   - Calculará el valor de negocio
   - Generará todas las gráficas
   - Actualizará este reporte
   - Hará commit de los cambios al repositorio


---

## Archivos de datos

- **Historias completadas:** [`data/completed_stories.csv`](data/completed_stories.csv)
- **Valores de negocio por historia:** [`data/story_business_values.csv`](data/story_business_values.csv)
- **Datos de velocidad:** [`data/velocity_data.csv`](data/velocity_data.csv)
- **Burndown del release:** [`data/release_burndown_data.csv`](data/release_burndown_data.csv)

---

*Generado automáticamente por GitHub Actions*
"""

    # Write to file
    output_file = Path("CHARTS.md")
    output_file.write_text(md_content)

    print(f"✓ Reporte generado: {output_file}")
    print(f"  Valor de negocio: {bv_total:.1f}/100 puntos")
    print(f"  Historias completadas: {bv_stories}")
    print(f"  Semanas registradas: {vel_weeks}")


if __name__ == "__main__":
    generate_report()
