const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Importing cors middleware

const app = express();
app.use(express.json());
app.use(cors());


const baseDir = path.join(__dirname, 'data'); // Directory to store JSON files

const updateElementById = (elements, id, newData) => {
    return elements.map(element => {
        if (element.id === id) {
            return { ...element, ...newData };
        }

        if (element.children && element.children.length > 0) {
            return {
                ...element,
                children: updateElementById(element.children, id, newData)
            };
        }

        return element;
    });
};

// Route 0: Update File child by element id
app.put('/update/:filename/:id', (req, res) => {
    console.log('Received PUT request',req.body);
    console.log('Request Body:', req.body);
    console.log('File Path:', path.join(baseDir, `${req.params.filename}.json`));

    const filePath = path.join(baseDir, `${req.params.filename}.json`);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(404).json({ error: 'File not found' });
        }

        let jsonData = JSON.parse(data);
        let elementFound = false;

        function findAndUpdateElement(body, id) {
            for (let i = 0; i < body.length; i++) {
                if (body[i].id === id) {
                    body[i] = { ...body[i], ...req.body };
                    elementFound = true;
                    return;
                }
                if (body[i].children && body[i].children.length > 0) {
                    findAndUpdateElement(body[i].children, id);
                }
            }
        }

        findAndUpdateElement(jsonData.body, req.params.id);

        if (!elementFound) {
            console.error('Element not found:', req.params.id);
            return res.status(404).json({ error: 'Element not found' });
        }

        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).json({ error: 'Failed to update file' });
            }
            res.json({ message: 'Element updated successfully', element: jsonData.body });
        });
    });
});

// Route 1: Get the content of a JSON file
app.get('/get/:filename', (req, res) => {
  try{
    console.log("getting page here ....");
    const filePath = path.join(baseDir, `${req.params.filename}.json`);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'File not found' });
        }
        res.json(JSON.parse(data));
    });
  }catch(e){
    console.log(e)
  }
});

// Route 2: Write the content to a JSON file (overwrite)
app.post('/set/:filename', (req, res) => {
    const filePath = path.join(baseDir, `${req.params.filename}.json`);
    
    fs.writeFile(filePath, JSON.stringify(req.body, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to write file' });
        }
        res.json({ message: 'File written successfully' });
    });
});

// Route 3: Append an element to the body list in the JSON file
app.post('/new/:filename', (req, res) => {
    const filePath = path.join(baseDir, `${req.params.filename}.json`);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'File not found' });
        }

        let jsonData = JSON.parse(data);
        if (!Array.isArray(jsonData.body)) {
            jsonData.body = [];
        }
        jsonData.body.push(req.body);

        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to update file' });
            }
            res.json({ message: 'Element appended successfully' });
        });
    });
});

// Route 4: Remove an element by ID from the body list in the JSON file
app.delete('/remove/:filename/:id', (req, res) => {
    const filePath = path.join(baseDir, `${req.params.filename}.json`);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'File not found' });
        }

        let jsonData = JSON.parse(data);
        if (!Array.isArray(jsonData.body)) {
            return res.status(400).json({ error: 'No body array found in JSON' });
        }

        const removeElementById = (elements, id) => {
            return elements
                .filter(item => item.id !== id)
                .map(item => {
                    if (item.children && item.children.length > 0) {
                        return {
                            ...item,
                            children: removeElementById(item.children, id),
                        };
                    }
                    return item;
                });
        };

        jsonData.body = removeElementById(jsonData.body, req.params.id);

        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to update file' });
            }
            res.json({ message: 'Element removed successfully' });
        });
    });
});

// Route: Get an element by ID from the body list in the JSON file
app.get('/get/:filename/:id', (req, res) => {
    const filePath = path.join(baseDir, `${req.params.filename}.json`);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'File not found' });
        }

        let jsonData = JSON.parse(data);
        const element = jsonData.body.find(item => item.id === req.params.id);

        if (!element) {
            return res.status(404).json({ error: 'Element not found' });
        }

        res.json(element);
    });
});


// Route: Update an element by ID in the body list in the JSON file
app.put('/update/:filename/:id', (req, res) => {
    const filePath = path.join(baseDir, `${req.params.filename}.json`);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'File not found' });
        }

        let jsonData = JSON.parse(data);
        let elementIndex = jsonData.body.findIndex(item => item.id === req.params.id);

        if (elementIndex === -1) {
            return res.status(404).json({ error: 'Element not found' });
        }

        // Update the element
        jsonData.body[elementIndex] = { ...jsonData.body[elementIndex], ...req.body };

        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to update file' });
            }
            res.json({ message: 'Element updated successfully', element: jsonData.body[elementIndex] });
        });
    });
});

app.put('/rename/:oldFileName/:newFileName', (req, res) => {
    const filePath = path.join(baseDir, 'projects.json');
    const oldFilePath = path.join(baseDir, `${req.params.oldFileName}.json`);
    const newFilePath = path.join(baseDir, `${req.params.newFileName}.json`);

    // Read and update the projects.json file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'projects.json file not found' });
        }

        let jsonData = JSON.parse(data);

        // Check if oldFileName exists in details
        const oldFileIndex = jsonData.details.indexOf(req.params.oldFileName);
        if (oldFileIndex === -1) {
            return res.status(404).json({ error: 'Old file name not found in details' });
        }

        // Rename the key in details array
        jsonData.details[oldFileIndex] = req.params.newFileName;

        // Write the updated JSON back to the file
        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to update projects.json' });
            }

            // Now rename the actual file
            fs.rename(oldFilePath, newFilePath, (err) => {
                if (err) {
                    console.error('Error renaming file:', err);
                    return res.status(500).json({ error: 'Failed to rename file' });
                }

                // Send the response only after both operations are successful
                res.json({ message: 'File renamed successfully', details: jsonData.details });
            });
        });
    });
});



// Route 1: Get the content of a JSON file
app.get('/', (req, res) => {
  try{
  
        res.send("Aqsa Kadilari Api .......");
  
  }catch(e){
    console.log(e)
  }
});

// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

module.exports = app;
