// DOM Elements
const gridContainer = document.getElementById('gridContainer');
const boldIcon = document.getElementById('boldIcon');
const italicIcon = document.getElementById('italicIcon');
const underlineIcon = document.getElementById('underlineIcon');
const leftAlignIcon = document.querySelector('.fa-align-left');
const centerAlignIcon = document.querySelector('.fa-align-center');
const rightAlignIcon = document.querySelector('.fa-align-right');
const fontSizeInput = document.querySelector('.font_size_input');
const fontFamilyInput = document.querySelector('.font_family_input');
const textColorInput = document.getElementById("textColorInput");
const backgroundColorInput = document.getElementById("backgroundColorInput");
const addNoteButton = document.getElementById("addNoteButton");
const deleteAllNotesButton = document.getElementById("deleteNoteButton");

let notes = [];
let selectedText = null;

// Default styles
let defaultStyles = {
    color: "#000000",
    backgroundColor: "#ffffff",
    fontSize: "16px",
    fontFamily: "Arial, sans-serif",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    textAlign: "left"
};

// Event listeners for styling
textColorInput.addEventListener("change", function() {
    defaultStyles.color = textColorInput.value;
    applyStyleToSelection("color", textColorInput.value);
});

backgroundColorInput.addEventListener("change", function() {
    defaultStyles.backgroundColor = backgroundColorInput.value;
    applyStyleToSelection("backgroundColor", backgroundColorInput.value);
});

fontSizeInput.addEventListener("change", function() {
    defaultStyles.fontSize = this.value + "px";
    applyStyleToSelection("fontSize", this.value + "px");
});

fontFamilyInput.addEventListener("change", function() {
    defaultStyles.fontFamily = this.value;
    applyStyleToSelection("fontFamily", this.value);
});

// Text formatting buttons
boldIcon.addEventListener("click", () => toggleFormat('fontWeight', 'bold', boldIcon));
italicIcon.addEventListener("click", () => toggleFormat('fontStyle', 'italic', italicIcon));
underlineIcon.addEventListener("click", () => toggleFormat('textDecoration', 'underline', underlineIcon));

// Alignment buttons
leftAlignIcon.addEventListener("click", () => setAlignment('left'));
centerAlignIcon.addEventListener("click", () => setAlignment('center'));
rightAlignIcon.addEventListener("click", () => setAlignment('right'));

// Note management
addNoteButton.addEventListener("click", addNote);
deleteAllNotesButton.addEventListener("click", () => {
    gridContainer.innerHTML = '';
    notes = [];
    renderNotesList();
});

// Helper Functions
function toggleFormat(property, value, icon) {
    const newValue = defaultStyles[property] === value ? "normal" : value;
    defaultStyles[property] = newValue;
    icon.classList.toggle("selected", newValue === value);
    applyStyleToSelection(property, newValue);
}

function setAlignment(alignment) {
    defaultStyles.textAlign = alignment;
    document.querySelectorAll('.alignment_container i').forEach(icon => {
        icon.classList.remove('selected');
    });
    document.querySelector(`.fa-align-${alignment}`).classList.add('selected');
    applyStyleToSelection('textAlign', alignment);
}

function applyStyleToSelection(styleType, styleValue) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText.length === 0) return;

    const span = document.createElement("span");
    span.style[styleType] = styleValue;
    span.textContent = selectedText;

    range.deleteContents();
    range.insertNode(span);
}

function addNote() {
    if (notes.length >= 30) {
        alert("You cannot add more than 30 notes. Please delete some notes to continue.");
        return;
    }

    const noteContainer = document.createElement("div");
    noteContainer.className = 'note-container';

    const note = document.createElement('div');
    note.className = 'note';
    note.setAttribute('contenteditable', 'true');
    note.innerHTML = 'Write your note here...';

    // Apply current styles to new note
    applyCurrentStyles(note);

    // Pin button
    const pinButton = document.createElement('i');
    pinButton.className = 'fas fa-thumbtack pin-button';
    pinButton.addEventListener('click', () => togglePin(noteContainer, pinButton));

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.innerHTML = 'Delete';
    deleteButton.addEventListener('click', () => {
        noteContainer.remove();
        notes = notes.filter(n => n.content !== note.innerHTML);
        renderNotesList();
    });

    // Add event listener for highlighting terms
    note.addEventListener('blur', () => {
        highlightTerms(note);
    });

    noteContainer.appendChild(pinButton);
    noteContainer.appendChild(note);
    noteContainer.appendChild(deleteButton);

    gridContainer.appendChild(noteContainer);
    
    notes.push({ content: note.innerHTML, pinned: false });
    renderNotesList();
}

function togglePin(noteContainer, pinButton) {
    noteContainer.classList.toggle("pinned");
    pinButton.classList.toggle("pinned-icon");
    
    const noteContent = noteContainer.querySelector('.note').innerHTML;
    const noteIndex = notes.findIndex(note => note.content === noteContent);
    
    if (noteIndex !== -1) {
        notes[noteIndex].pinned = !notes[noteIndex].pinned;
    }
    
    if (noteContainer.classList.contains("pinned")) {
        gridContainer.insertBefore(noteContainer, gridContainer.firstChild);
    }
    
    renderNotesList();
}

function applyCurrentStyles(noteContent) {
    Object.entries(defaultStyles).forEach(([property, value]) => {
        noteContent.style[property] = value;
    });
}

// Keywords highlighting functionality
const keywords = ['AI', 'machine learning', 'deep learning', 'data science', 'neural networks', 'computer vision'];

async function highlightTerms(note) {
    let content = note.innerHTML;
    
    for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        content = content.replace(regex, `<span class="highlighted" data-keyword="${keyword}">${keyword}</span>`);
    }
    
    note.innerHTML = content;
    
    note.querySelectorAll('.highlighted').forEach(element => {
        element.addEventListener('mouseenter', async () => {
            const keyword = element.getAttribute('data-keyword');
            const definition = await getKeywordDefinition(keyword);
            
            const tooltip = document.getElementById('tooltip');
            tooltip.innerHTML = definition;
            tooltip.style.display = 'block';
            tooltip.style.top = `${element.getBoundingClientRect().top + window.scrollY}px`;
            tooltip.style.left = `${element.getBoundingClientRect().left + window.scrollX}px`;
        });
        
        element.addEventListener('mouseleave', () => {
            document.getElementById('tooltip').style.display = 'none';
        });
    });
}

async function getKeywordDefinition(keyword) {
    try {
        const response = await fetch('http://localhost:5000/get-definition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyword: keyword }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data.definition;
    } catch (error) {
        console.error('Error fetching definition:', error);
        return 'Definition not available';
    }
}

function renderNotesList() {
    const notesList = document.getElementById("notesList");
    if (!notesList) return;
    
    notesList.innerHTML = "";
    
    const sortedNotes = notes.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    
    sortedNotes.forEach(note => {
        const listItem = document.createElement("li");
        listItem.textContent = truncateText(note.content.replace(/<[^>]*>/g, ''), 5);
        listItem.classList.add(note.pinned ? "pinned" : "unpinned");
        notesList.appendChild(listItem);
    });
}

function truncateText(text, wordCount) {
    const words = text.split(' ');
    return words.length > wordCount ? words.slice(0, wordCount).join(' ') + '...' : text;
}

// Initialize
addNote();