from django import template

register = template.Library()

@register.filter
def format_duration(seconds):
    """Convert seconds to 'Xm Ys' or 'Hh Mm Ss' format."""
    if seconds is None:
        return "—"

    seconds = int(seconds)
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60

    if h > 0:
        return f"{h}h {m:02d}m {s:02d}s"
    return f"{m}m {s:02d}s"
