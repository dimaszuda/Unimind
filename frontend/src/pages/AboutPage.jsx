import { Link } from "react-router-dom";

const paragraphs = [
    "UniMind adalah laboratorium virtual berbasis AI pada materi Hukum Coulomb yang dirancang untuk membantu peserta didik SMP/MTs hingga SMA/MA memahami konsep gaya listrik secara interaktif dan mandiri.",
    "Melalui simulasi virtual, peserta didik dapat memvisualisasikan fenomena Hukum Coulomb, melakukan praktikum digital, serta mengeksplorasi konsep sesuai tujuan belajar yang dipilih.",
    "UniMind dilengkapi dengan AI Assistant yang membantu saat praktikum berlangsung dan AI Chatbot yang memandu refleksi pembelajaran serta mengevaluasi pemahaman konsep peserta didik.",
    "UniMind dikembangkan untuk mendukung pembelajaran fisika di sekolah dengan keterbatasan laboratorium sekaligus meningkatkan kemampuan belajar mandiri berbasis pendekatan Self-Regulated Learning (SRL).",
];

const contentStyle = {
    color: "black",
    fontSize: "18px",
    fontFamily: "sans-serif",
    textAlign: "justify",
    marginLeft: "170px",
    marginRight: "200px",
};

export default function AboutPage() {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center relative"
            style={{
                backgroundImage: "url('/assets/BackgroundAbout.png')",
                backgroundSize: "90%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundColor: "#83ccdf",
            }}
        >
            <div className="mt-48 flex flex-col">
                <Link to="/" className="self-end" style={{ marginRight: 180 }}>
                    <img
                        src="assets/Button_Close.png"
                        alt="tombol keluar"
                        width={80}
                        style={{ marginTop: "-100px" }}
                        className="cursor-pointer hover:scale-110 hover:opacity-90 transition-all duration-200"
                    />
                </Link>

                <div className="font-bold space-y-3" style={contentStyle}>
                    {paragraphs.map((text, index) => (
                        <p key={index}>{text}</p>
                    ))}
                    <p className="pt-2 text-center font-extrabold">
                        Developed by: Eka Tuti Setyawati
                    </p>
                </div>
            </div>
        </div>
    );
}