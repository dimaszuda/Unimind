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
                <Link to="/about">
                    <img
                        src="assets/Button_About.png"
                        alt="About"
                        width={205}
                        className="cursor-pointer hover:opacity-80 hover:scale-110 transition-opacity duration-200"
                    />
                </Link>
                <Link to="/how-to-play">
                    <img
                        src="assets/Button_HowToPlay.png"
                        alt="How to Play"
                        width={205}
                        className="cursor-pointer hover:opacity-80 hover:scale-110 transition-opacity duration-200"
                    />
                </Link>
            </div>
        </div>
    </Background>
  )
}