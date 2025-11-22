from ultralytics import YOLO
import cv2, requests, time, pytesseract
from PIL import Image
import numpy as np

# Tesseract full path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

model = YOLO("yolov8n.pt")
API_URL = "http://localhost:5000/alert"

cap = cv2.VideoCapture("accident.mp4")
prev_center = {}
alert_sent_for_id = set()

CAMERA_LAT = 12.9716
CAMERA_LNG = 77.5946


def extract_text(frame):
    h, w = frame.shape[:2]

    # Tight crop on top left area where CCTV info appears
    roi = frame[0:int(h * 0.14), int(w * 0.55):w]

    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)

    text = pytesseract.image_to_string(gray)
    cleaned = " ".join(text.split())

    if len(cleaned) < 3:
        return "Unknown Location"

    return cleaned[:40]


def calc_severity(speed):
    if speed > 40: return "High"
    elif speed > 25: return "Medium"
    return "Low"


while True:
    ret, frame = cap.read()
    if not ret: break

    results = model(frame)[0]

    for i, box in enumerate(results.boxes):
        cls = model.names[int(box.cls[0])]
        if cls not in ["car", "motorcycle"]: 
            continue

        x1, y1, x2, y2 = box.xyxy[0]
        box_id = i  # use index as unique ID per frame
        center = ((x1 + x2) / 2, (y1 + y2) / 2)

        if box_id in prev_center:
            speed = abs(center[0] - prev_center[box_id][0]) + abs(center[1] - prev_center[box_id][1])
            severity = calc_severity(speed)

            if speed > 30 and box_id not in alert_sent_for_id:
                location_text = extract_text(frame)

                # Convert snapshot to base64 JPEG
                _, jpeg = cv2.imencode(".jpg", frame)
                snapshot = jpeg.tobytes()

                data = {
                    "lat": CAMERA_LAT,
                    "lng": CAMERA_LNG,
                    "severity": severity,
                    "time": time.strftime("%H:%M:%S"),
                    "location_text": location_text,
                    "image": snapshot.hex()
                }

                try:
                    requests.post(API_URL, json=data)
                    print(f"\n🚨 Accident Detected!")
                    print("Severity:", severity)
                    print("📍", location_text)
                    alert_sent_for_id.add(box_id)
                except Exception as e:
                    print("⚠ Alert send failed:", e)

        prev_center[box_id] = center

    cv2.imshow("Accident Detection", frame)
    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()
