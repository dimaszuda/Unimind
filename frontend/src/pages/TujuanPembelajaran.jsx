import { Link } from "react-router-dom";
import useSimulationStore from "../store/simulationStore";

const tujuanPembelajaran = [
    {number: 1, tujuan: "Menjelaskan arah gaya listrik yang terjadi antara dua muatan listrik"},
    {number: 2, tujuan: "Menjelaskan hubungan antara besar gaya listrik dengan besar muatan listrik"},
    {number: 3, tujuan: "Menjelaskan hubungan antara besar gaya listrik dengan jarak antara dua muatan"},
    {number: 4, tujuan: "Merumuskan persamaan matematis Hukum Coulomb berdasarkan hasil pengamatan"}
];

const contentStyle = {
    color: "black",
    fontSize: "20px",
    fontFamily: "sans-serif",
    textAlign: "justify",
    marginLeft: "170px",
    marginRight: "200px",
};

export default function Tujuan() {
    const selectedStage = useSimulationStore((s) => s.selectedStage);

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center relative"
            style={{
                backgroundImage: "url('/assets/BackgroundTujuanBelajar.png')",
                backgroundSize: "90%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundColor: "#83ccdf",
            }}
        >
            <div className="absolute top-36 right-36">
                <Link to="/pemilihan">
                    <img
                        src="assets/Button_Close.png"
                        alt="tombol keluar"
                        width={80}
                        className="cursor-pointer hover:scale-110 hover:opacity-90 transition-all duration-200"
                    />
                </Link>
            </div>
            <div className="flex flex-col">
                <ol className="font-bold space-y-3 mt-20" style={{ ...contentStyle, listStyle: "none" }}>
                    {tujuanPembelajaran
                        .filter(({ number }) => number <= selectedStage)
                        .map(({ number, tujuan }) => (
                            <li key={number}>
                                <span className="font-bold text-[22px]">
                                    {number}. {tujuan}
                                </span>
                            </li>
                    ))}
                </ol>
            </div>
            <div className="absolute bottom-16 right-48">
                <Link to="/level-one">
                    <img
                        src="assets/Button_Lanjutkan.png"
                        alt="Tombol Lanjutkan"
                        width={180}
                        className="cursor-pointer hover:scale-110 hover:opacity-80 transition-all duration-200"
                    />
                </Link>
            </div>
        </div>
    )
}