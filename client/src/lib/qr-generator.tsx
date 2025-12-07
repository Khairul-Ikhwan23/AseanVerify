import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeGenerator({ value, size = 128, className = "" }: QRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!qrRef.current) return;

    async function generateQR() {
      try {
        console.log('Generating QR code with value:', value);
        
        // Generate QR code as data URL
        const qrDataURL = await QRCode.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: '#1E40AF',
            light: '#ffffff'
          }
        });

        if (qrRef.current) {
          qrRef.current.innerHTML = '';
          const img = document.createElement('img');
          img.src = qrDataURL;
          img.alt = 'QR Code';
          img.style.width = `${size}px`;
          img.style.height = `${size}px`;
          qrRef.current.appendChild(img);
          console.log('QR code generated successfully');
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
        if (qrRef.current) {
          qrRef.current.innerHTML = '<div style="width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; background: #fee2e2; border: 1px solid #fecaca; border-radius: 4px;"><span style="font-size: 10px; color: #dc2626;">QR Error</span></div>';
        }
      }
    }

    generateQR();
  }, [value, size]);

  return <div ref={qrRef} className={className} data-testid="qr-code"></div>;
}
