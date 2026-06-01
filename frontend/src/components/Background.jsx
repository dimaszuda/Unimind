export default function Background({ children }) {
    return (
        <div
            className="min-h-screen text-white flex flex-col items-center justify-center gap-6 relative"
            style={{
                backgroundImage: "url('/assets/Background.png')",
                backgroundSize: "90%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundColor: "#83ccdf"
            }}
        >
            {children}
        </div>
    )
}