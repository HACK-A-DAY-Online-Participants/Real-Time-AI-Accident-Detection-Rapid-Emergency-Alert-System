from ultralytics import YOLO
import cv2, requests, time

model = YOLO("yolov8n.pt")
API_URL = "http://localhost:5000/alert"

cap = cv2.VideoCapture("accident.mp4")
prev_center = None

def calc_severity(speed):
    if speed > 35: return "High"
    elif speed > 20: return "Medium"
    return "Low"

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame)[0]

    for box in results.boxes:
        cls = model.names[int(box.cls[0])]
        if cls in ["car", "motorcycle"]:
            x1,y1,x2,y2 = box.xyxy[0]
            center = ((x1+x2)/2, (y1+y2)/2)
            if prev_center:
                speed = abs(center[0]-prev_center[0]) + abs(center[1]-prev_center[1])
                severity = calc_severity(speed)

                if speed > 30:
                    requests.post(API_URL, json={
                        "location": "12.91,77.60",
                        "severity": severity,
                        "time": time.strftime("%H:%M:%S")
                    })
                    print(f"🚨 Accident Detected! Severity: {severity}")
                    break
            prev_center = center

    cv2.imshow("Video", frame)
    if cv2.waitKey(1) == 27:
        break

cv2.destroyAllWindows()
