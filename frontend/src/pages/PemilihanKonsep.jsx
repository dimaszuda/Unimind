import { Link, useNavigate } from "react-router-dom";
import Background from "../components/Background";
import { useState } from "react";
import useSimulationStore from "../store/simulationStore";

const stages = [
    { img: "Button_Tahap1.png", alt: "Tahap 1: Mengetahui Arah Gaya", label: "Mengetahui Arah Gaya" },
    { img: "Button_Tahap2.png", alt: "Tahap 2: Hubungan Gaya Listrik dan Besar Muatan", label: "Hubungan Gaya Listrik dan Besar Muatan" },
    { img: "Button_Tahap3.png", alt: "Tahap 3: Hubungan Besar Gaya dan Besar Muatan", label: "Hubungan Besar Gaya dan Besar Muatan" },
    { img: "Button_Tahap4.png", alt: "Tahap 4: Merumuskan Persamaan", label: "Merumuskan Persamaan" },
];

export default function Pemilihan() {
    const storedName = useSimulationStore((s) => s.playerName);
    const storedStage = useSimulationStore((s) => s.selectedStage);
    const [selected, setSelected] = useState(storedStage != null ? storedStage - 1 : null);
    const [name, setName] = useState(storedName ?? "");
    const [errorsName, setErrorsName] = useState("");
    const [errorStage, setErrorStage] = useState("");
    const setPlayer = useSimulationStore((s) => s.setPlayer);
    const navigate = useNavigate();

    const toggle = (index) => {
        setSelected(prev => prev === index ? null : index);
        setErrorStage("");
    };

    const handleLanjutkan = () => {
        let newErrorName = "";
        let newErrorStage = "";
        
        if (!name.trim()) {
            newErrorName = "Nama harus diisi!";
        }
        
        if (selected === null) {
            newErrorStage = "Silakan pilih konsep terlebih dahulu!";
        }
        
        setErrorsName(newErrorName);
        setErrorStage(newErrorStage);
        
        if (newErrorName === "" && newErrorStage === "") {
            setPlayer(name.trim(), selected + 1);
            navigate("/tujuan");
        }
    };

    return (
        <Background>
            <div className="absolute top-12 right-20">
                <Link to="/">
                    <img
                        src="assets/Button_Close.png"
                        alt="Tombol Close"
                        width={62}
                        className="cursor-pointer right-full hover:scale-110 hover:opacity-90 transition-all duration-200"
                    />
                </Link>
            </div>
            <div className="flex flex-col justify-center items-center gap-12">
                <img
                    src="assets/Text_PilihanProgram.png"
                    alt="Teks Pilihan Program"
                    width={800}
                />
                <div className="flex justify-center items-center gap-4">
                    <h3 className="text-white text-4xl font-bold whitespace-nowrap">
                        Nama:
                    </h3>
                    <div className="flex flex-col">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setErrorsName("");
                            }}
                            className="bg-white rounded-full w-80 px-3 py-2 text-black"
                        />
                        {errorsName && (
                            <p className="text-red-400 text-m text-bold mt-1 text-center">{errorsName}</p>
                        )}
                    </div>
                </div>
                <div className="flex justify-center gap-12">
                    {stages.map((stage, index) => (
                        <div key={index} className="flex flex-col items-center gap-4 w-36">
                            <div className="relative flex items-center justify-center w-[120px] h-[120px]">
                                <img
                                    src={`assets/${stage.img}`}
                                    alt={stage.alt}
                                    width={120}
                                    className={`cursor-pointer transition-all duration-200 ${
                                        selected === index
                                            ? "scale-150"
                                            : "hover:scale-110 hover:opacity-80"
                                    }`}
                                    onClick={() => toggle(index)}
                                />
                                {selected === index && (
                                    <img
                                        src="assets/Icon_Checklist.png"
                                        alt="Checklist"
                                        width={48}
                                        className="absolute -top-8 right-[5.8rem] z-10 pointer-events-none"
                                    />
                                )}
                            </div>
                            <p className={`text-white text-center ml-4 text-m font-bold leading-snug transition-all duration-200 ${
                                        selected === index
                                            ? "mt-4"
                                            : ""
                                    }`}>
                                {stage.label}
                            </p>
                        </div>
                    ))}
                </div>
                {errorStage && (
                    <p className="text-red-400 text-m text-bold -mt-8">{errorStage}</p>
                )}
                <div className="absolute bottom-16 right-12">
                    <img
                        src="assets/Button_Lanjutkan.png"
                        alt="Tombol Lanjutkan"
                        width={180}
                        className="cursor-pointer hover:scale-110 hover:opacity-80 transition-all duration-200"
                        onClick={handleLanjutkan}
                    />
                </div>
            </div>
        </Background>
    );
}