const video = document.getElementById("video");

var labels = []
var DATA;
var canvas;

const firebaseConfig = {
  apiKey: "AIzaSyBZnFJQJlCQEFdvmFLI0gkSCHHiH1lUAWo",
  authDomain: "node-file-uploader.firebaseapp.com",
  projectId: "node-file-uploader",
  storageBucket: "node-file-uploader.appspot.com",
  messagingSenderId: "345185058962",
  appId: "1:345185058962:web:8629baa36820a3c410a64b",
  measurementId: "G-GSV81VWQE1"
};
  
firebase.initializeApp(firebaseConfig);

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models")
])
  .then(startWebcam)
  .then(faceRecognition);

function startWebcam(){
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error(error);
    });
}

async function getLabels(){
  var listRef = await firebase.storage().ref(`labels`);
    // Find all the prefixes and items.
    await listRef.listAll()
      .then((res) => {
        res.prefixes.forEach((folderRef) => {
          // labels = []
          // console.log(folderRef)
          // All the prefixes under listRef.
          // You may call listAll() recursively on them.
          // console.log(folderRef.location.path_.slice(7))
          labels.push(folderRef.location.path_.slice(7))
        });
        // res.items.forEach((itemRef) => {
          // All the items under listRef.
        // });
      }).catch((error) => {
        // Uh-oh, an error occurred!
        console.error(error)
      });
      // console.log(labels)
}


// function getLabeledFaceDescriptions() {
//   // const labels = ["Vaibhav"];
//   const labels = ["Abhijeet","Aditya","KP","Madan","Navin","Pradeep","Rakesh","Ravi","Sachin","Sanath","Shrishail","Surya","Vaibhav","Apoorva"];
//   return Promise.all(
//     labels.map(async (label) => {
//       const descriptions = [];
//       for (let i = 1; i < 2; i++){
//         const img = await faceapi.fetchImage(`./labels/${label}/${i}.png`);
//         // console.log(img)
//         const detections = await faceapi
//           .detectSingleFace(img)
//           .withFaceLandmarks()
//           .withFaceDescriptor();
//           // console.log(detections)
//         descriptions.push(detections.descriptor);
//       }
//       // console.log(descriptions)
//       return new faceapi.LabeledFaceDescriptors(label, descriptions);
//     })
//   );
// }

getLabels()

function getLabeledFaceDescriptions() {
  // const response =  await fetch('https://face-registration.onrender.com/getLabels')
  // const labels = await response.json()
  // console.log(labels)
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
        let path = `labels/${label}`
        await firebase.storage().ref(path).child(`1`).getDownloadURL()
        .then(async (url) => {
          const img = await faceapi.fetchImage(url)
          // console.log(url)
          const detections = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();
          descriptions.push(detections.descriptor);
          })
        .catch((error) => {
          // Handle any errors
          console.error(error)
        });
        // console.log(descriptions)
      // }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
  // })
}


async function faceRecognition() {
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
  
    video.addEventListener("playing", () => {
    location.reload();
  });

    canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    let faceTimer = setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceDescriptors();

        // console.log(detections)

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

      const results = resizedDetections.map((d) => {
        // console.log(d)
        return faceMatcher.findBestMatch(d.descriptor);
      });
      results.forEach((result, i) => {
        // console.log(result.label)
        const box = resizedDetections[i].detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: result.label,
        });
        DATA = result._label.split('+')
        drawBox.draw(canvas);
        clearInterval(faceTimer)
        showPrint()
      });
    }, 1000);
}


function showPrint(){
  
  NAME = DATA[0]
  COMPANY = DATA[1]
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById('video').style.display = 'none'
  // document.getElementById('canvas').style.display = 'none'
  document.getElementById('body').style.backgroundImage="url(../assets/images/bgs/Webscreen3.png)";
  document.getElementById('PrintBadge').style.display = 'flex'
  document.getElementById('Name').innerHTML += NAME
  document.getElementById('Company').innerHTML += COMPANY
}

function downloadReceipt() {
  // document.getElementById('print').style.display = 'none'
  const data = document.getElementById('show');
  html2canvas(data,{allowTaint:true}).then(async(canvas) => {
  const image64 = canvas.toDataURL();
  const data = { image64 };
  const options1 = {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
  };
  const response = await fetch('https://face-registration-service.onrender.com/upload', options1)
  const res_data = await response.json()
  console.log(res_data.ImageName)
  showThanks()
  })
}

function goBack(){
  location.reload()
}

function showThanks(){
  document.getElementById('PrintBadge').style.display = 'none'
  document.getElementById('showThanks').style.display = 'flex'
  setTimeout(()=>{
    location.reload()
  },5000)
}

function backSub(){
  location.href = '/'
}