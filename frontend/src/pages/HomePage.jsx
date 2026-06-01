import { Link } from "react-router-dom";
import Background from "../components/Background";

export default function HomePage() {
  return (
    <Background>
      <img 
        src="assets/Text_SelamatDatang.png" 
        alt="Selamat Datang" 
        width={660}
        height={120}
        className="mb-4 -translate-y-20"
        />
        <div className="relative flex items-center justify-center">
            <img 
                src="assets/Image_Robot.png" 
                alt="Timi Bot" 
                width={200}
                className="absolute right-full mr-36"
            />
            <div className="flex flex-col gap-8">
                <Link to="/pemilihan">
                    <img
                        src="assets/Button_Mulai.png" 
                        alt="Start Button" 
                        width={205}
                        className="cursor-pointer hover:opacity-80 hover:scale-110 transition-opacity duration-200"
                    />
                </Link>
                <img 
                    src="assets/Button_Keluar.png" 
                    alt="Exit Button" 
                    width={205}
                    className="cursor-pointer hover:opacity-80 hover:scale-110 transition-opacity duration-200"
                    onClick={() => { window.close(); }}
                />
            </div>
        </div>
        <div className="flex absolute bottom-12 right-20 gap-6">
            <div className="relative inline-block group">
                <Link to="/how-to-play">
                    <img
                        src="assets/Button_HowToPlay.png"
                        alt="How to Play"
                        width={50}
                        className="cursor-pointer hover:scale-110 hover:opacity-80 transition-all duration-200"
                    />
                </Link>

                <div
                    className="
                        absolute
                        left-1/2
                        -translate-x-1/2
                        bottom-full
                        mb-2
                        px-3
                        py-1
                        bg-blue-600
                        text-white
                        rounded-[10px]
                        text-sm
                        whitespace-nowrap
                        opacity-0
                        group-hover:opacity-100
                        transition-opacity
                        duration-200
                        pointer-events-none
                    "
                >
                    How to Play
                </div>
            </div>

            <div className="relative inline-block group">
                <Link to="/about">
                    <img
                        src="assets/Button_About.png"
                        alt="About"
                        width={50}
                        className="cursor-pointer hover:scale-110 hover:opacity-80 transition-all duration-200"
                    />
                </Link>

                <div
                    className="
                        absolute
                        left-1/2
                        -translate-x-1/2
                        bottom-full
                        mb-2
                        px-3
                        py-1
                        bg-blue-600
                        text-white
                        rounded-[10px]
                        text-sm
                        whitespace-nowrap
                        opacity-0
                        group-hover:opacity-100
                        transition-opacity
                        duration-200
                        pointer-events-none
                    "
                >
                    About
                </div>
            </div>
        </div>
    </Background>
  )
}