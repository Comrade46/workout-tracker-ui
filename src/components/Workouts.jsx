import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Workouts() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/workout-history", {
            replace: true
        });
    }, [navigate]);

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.icon}>
                    🏋️
                </div>

                <h2 style={styles.title}>
                    Opening Workout History...
                </h2>

                <p style={styles.text}>
                    Redirecting to your workout history.
                </p>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px"
    },

    card: {
        textAlign: "center",
        backgroundColor: "#fff",
        borderRadius: "18px",
        padding: "40px",
        boxShadow:
            "0 6px 22px rgba(0,0,0,0.08)",
        border: "1px solid rgba(0,0,0,0.05)"
    },

    icon: {
        fontSize: "45px",
        marginBottom: "10px"
    },

    title: {
        margin: 0,
        color: "#111",
        fontSize: "22px"
    },

    text: {
        color: "#777",
        marginTop: "8px"
    }
};

export default Workouts;