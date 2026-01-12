# Getting Started with JavaScript

**Published on January 10, 2026**

JavaScript is the programming language of the web. In this guide, we'll cover the fundamentals you need to start writing JavaScript code.

## What is JavaScript?

JavaScript is a high-level, interpreted programming language that enables you to create dynamically updating content, control multimedia, animate images, and much more.

## Variables

Variables are containers for storing data values. JavaScript has three ways to declare variables:

```javascript
// const - cannot be reassigned
const name = "John";

// let - can be reassigned
let age = 25;

// var - older way (avoid using)
var city = "New York";
```

### Best Practices

- Use `const` by default
- Use `let` when you need to reassign
- Avoid `var` in modern JavaScript

## Data Types

JavaScript has several data types:

1. **String**: Text data
2. **Number**: Numeric values
3. **Boolean**: true or false
4. **Array**: Ordered list of values
5. **Object**: Key-value pairs
6. **Null**: Intentional absence of value
7. **Undefined**: Variable declared but not assigned

```javascript
const text = "Hello"; // String
const number = 42; // Number
const isTrue = true; // Boolean
const items = [1, 2, 3]; // Array
const person = { name: "Jane" }; // Object
```

## Functions

Functions are reusable blocks of code:

```javascript
// Function declaration
function greet(name) {
  return `Hello, ${name}!`;
}

// Arrow function (modern syntax)
const greet = (name) => {
  return `Hello, ${name}!`;
};

// Concise arrow function
const greet = (name) => `Hello, ${name}!`;

// Using the function
console.log(greet("World")); // Output: Hello, World!
```

## Control Structures

### If Statements

```javascript
const age = 18;

if (age >= 18) {
  console.log("You are an adult");
} else {
  console.log("You are a minor");
}
```

### Loops

```javascript
// For loop
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// While loop
let count = 0;
while (count < 5) {
  console.log(count);
  count++;
}

// Array iteration
const numbers = [1, 2, 3, 4, 5];
numbers.forEach((num) => {
  console.log(num);
});
```

## Working with the DOM

JavaScript can manipulate HTML elements:

```javascript
// Select an element
const heading = document.querySelector("h1");

// Change its content
heading.textContent = "New Heading";

// Add an event listener
heading.addEventListener("click", () => {
  alert("Heading clicked!");
});
```

## Next Steps

Now that you understand the basics:

- Practice writing small programs
- Build simple web projects
- Learn about ES6+ features
- Explore JavaScript frameworks like React or Vue

> "JavaScript is the duct tape of the Internet." - Charlie Campbell

Happy coding!
