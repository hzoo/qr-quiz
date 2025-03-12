import { QRCode } from "@/components/QRCode";
import { helpModalOpen, QR_COMMANDS } from "@/store/uiSignals";
import { getQrCodeUrl } from "@/store/partyConnection";
import { useSignals } from "@preact/signals-react/runtime";
import { useComputed } from "@preact/signals-react";

export function HelpModal() {
  useSignals();
  
  const closeModal = () => {
    helpModalOpen.value = false;
  };
  
  if (!helpModalOpen.value) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={closeModal}>
      <div className="bg-[#2b2b33] p-5 rounded-xl shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-3">Barcode Quiz Help</h2>
        <p className="mb-3">Scan the QR codes with your barcode scanner or phone to navigate the quiz:</p>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li>Each QR code represents an answer option</li>
          <li>The corner position of each QR code matches its option letter</li>
          <li>Top-left (A), Top-right (B), Bottom-left (C), Bottom-right (D)</li>
          <li>Correct answers turn green, incorrect turn red</li>
        </ul>
        
        {/* Mobile scanner information */}
        <div className="mb-4 p-3 bg-[#23232b] rounded-lg">
          <h3 className="font-medium mb-2">Using a Phone as Scanner</h3>
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <QRCode 
                value="https://barcode-fun-party.hzoo.partykit.dev/qr.html"
                className="w-[80px] h-[80px]"
              />
            </div>
            <div className="text-sm">
              <p>Scan this QR code to open a dedicated scanner app on your phone.</p>
              <p className="text-[#e9a178] mt-1">This is faster than using your phone's camera!</p>
            </div>
          </div>
        </div>
        
        {/* Close QR code */}
        <div className="flex flex-col items-center mb-4">
          <span className="text-sm mb-2">Scan to close help</span>
          <div className="bg-white p-2 rounded-lg max-w-[120px]">
            <QRCode 
              value={QR_COMMANDS.CLOSE_HELP}
              className="w-full aspect-square"
            />
          </div>
        </div>
        
        <button 
          className="w-full py-2 bg-[#e9a178] text-[#1e1e24] rounded-lg font-medium"
          onClick={closeModal}
        >
          Close
        </button>
      </div>
    </div>
  );
} 