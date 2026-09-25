// ==========================================
// SEMANTIC VERSION HELPERS
// ==========================================
// Versions are MAJOR.MINOR.PATCH (e.g. 1.10.0).
// Parts are compared as numbers, so 1.10.0 > 1.9.0.
// A pre-release (1.2.0-beta.1) is older than its release (1.2.0).

function parseVersion(value) {
    const match = String(value || "")
        .trim()
        .replace(/^v/i, "")
        .match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?/);

    if (!match) {
        return null;
    }

    return {
        major: Number(match[1]),
        minor: Number(match[2] || 0),
        patch: Number(match[3] || 0),
        preRelease: match[4] || ""
    };
}

// Returns 1 when a > b, -1 when a < b, 0 when equal or not comparable.
export function compareVersions(a, b) {
    const left = parseVersion(a);
    const right = parseVersion(b);

    if (!left || !right) {
        return 0;
    }

    for (const part of ["major", "minor", "patch"]) {
        if (left[part] !== right[part]) {
            return left[part] > right[part] ? 1 : -1;
        }
    }

    if (left.preRelease === right.preRelease) {
        return 0;
    }

    // A release is newer than any of its pre-releases.
    if (!left.preRelease) return 1;
    if (!right.preRelease) return -1;

    return left.preRelease > right.preRelease ? 1 : -1;
}

export function isNewerVersion(candidate, current) {
    return compareVersions(candidate, current) > 0;
}
