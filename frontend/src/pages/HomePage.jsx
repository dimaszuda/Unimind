export default function HomePage() {
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
            {/* Tombol tetap di center */}
            <div className="flex flex-col gap-8">
                <img 
                    src="assets/Button_Mulai.png" 
                    alt="Start Button" 
                    width={205}
                />
                <img 
                    src="assets/Button_Keluar.png" 
                    alt="Exit Button" 
                    width={205}
                />
            </div>
        </div>
        <div className="flex absolute bottom-12 right-20 gap-6">
            <img
                src="assets/Button_HowToPlay.png"
                alt="How to Play"
                width={50}
            />
            <img
                src="assets/Button_About.png"
                alt="How to Play"
                width={50}
            />
        </div>
    </div>
  )
}