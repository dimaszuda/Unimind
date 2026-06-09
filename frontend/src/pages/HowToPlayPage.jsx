import { Link } from "react-router-dom";

const steps = [
    {
        number: 1,
        title: "Isi Identitas & Pilih Tujuan Pembelajaran",
        description:
            "Masukkan identitas diri dan pilih tujuan pembelajaran yang ingin dicapai. Sistem akan menampilkan fitur praktikum yang sesuai dengan tujuan yang dipilih.",
    },
    {
        number: 2,
        title: "Isi Identitas & Pilih Tujuan Pembelajaran",
        description:
            "Jalankan praktikum virtual sesuai petunjuk yang tersedia. Selama praktikum, pengguna dapat mengatur percobaan dan mengamati interaksi gaya listrik antar muatan.Jika mengalami kebingungan atau stuck, gunakan bantuan AI Assistant TIMI untuk mendapatkan arahan selama praktikum berlangsung.",
    },
    {
        number: 3,
        title: "Refleksi Bersama AI Chatbot",
        description:
            "Setelah praktikum selesai, pengguna akan berdiskusi dengan AI Chatbot untuk merefleksikan konsep yang telah dipelajari. Chatbot akan memberikan tanggapan dan membantu mengevaluasi apakah tujuan pembelajaran sudah tercapai atau belum.",
    },
];

const contentStyle = {
    color: "black",
    fontSize: "20px",
    fontFamily: "sans-serif",
    textAlign: "justify",
    marginLeft: "170px",
    marginRight: "200px",
};

export default function HowToPlayPage() {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center relative"
            style={{
                backgroundImage: "url('/assets/BackgroundHowToPlay.png')",
                backgroundSize: "90%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundColor: "#83ccdf",
            }}
        >
            <div className="mt-56 flex flex-col">
                <Link to="/" className="self-end" style={{ marginRight: 180 }}>
                    <img
                        src="assets/Button_Close.png"
                        alt="tombol keluar"
                        width={80}
                        style={{ marginTop: "-100px" }}
                        className="cursor-pointer hover:scale-110 hover:opacity-90 transition-all duration-200"
                    />
                </Link>

                <p className="font-bold mb-4" style={contentStyle}>
                    Selamat datang di Unimind (laboratorium virtual berbasis AI untuk materi Hukum
                    Coulomb). Ikuti tahapan berikut agar proses praktikum berjalan dengan optimal.
                </p>

                <ol className="font-bold space-y-3" style={{ ...contentStyle, listStyle: "none" }}>
                    {steps.map(({ number, title, description }) => (
                        <li key={number}>
                            <span className="font-extrabold">
                                {number}. {title}
                            </span>
                            <br />
                            {description}
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}