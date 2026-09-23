const recommendationMap = {
    Python: {
        topics: [
            "Python fundamentals",
            "Functions and modules",
            "Object-Oriented Programming",
            "Exception handling",
            "File handling",
            "Advanced Python"
        ]
    },
    SQL: {
        topics: [
            "SQL fundamentals",
            "SELECT and filtering",
            "GROUP BY and HAVING",
            "JOINs",
            "Subqueries",
            "Window Functions",
            "CTEs"
        ]
    },
    Pandas: {
        topics: [
            "DataFrames and Series",
            "Data cleaning",
            "Filtering and sorting",
            "GroupBy operations",
            "Merging and joining datasets",
            "Handling missing values",
            "Advanced Pandas"
        ]
    },
    NumPy: {
        topics: [
            "NumPy arrays",
            "Array indexing and slicing",
            "Broadcasting",
            "Vectorized operations",
            "Statistical functions",
            "Linear algebra"
        ]
    },
    Statistics: {
        topics: [
            "Descriptive statistics",
            "Mean, median and mode",
            "Variance and standard deviation",
            "Probability",
            "Distributions",
            "Hypothesis testing",
            "Correlation and regression"
        ]
    },
    "Machine Learning": {
        topics: [
            "Machine learning fundamentals",
            "Supervised learning",
            "Unsupervised learning",
            "Regression",
            "Classification",
            "Model evaluation",
            "Feature engineering"
        ]
    },
    Excel: {
        topics: [
            "Excel formulas",
            "Functions",
            "Conditional formatting",
            "Lookup functions",
            "Pivot Tables",
            "Data cleaning",
            "Advanced Excel"
        ]
    },
    "Power BI": {
        topics: [
            "Power BI fundamentals",
            "Data cleaning with Power Query",
            "Data modeling",
            "Relationships",
            "DAX",
            "Interactive dashboards",
            "Advanced visualizations"
        ]
    },
    "Data Visualization": {
        topics: [
            "Visualization fundamentals",
            "Choosing the right chart",
            "Matplotlib",
            "Seaborn",
            "Interactive visualizations",
            "Dashboard design",
            "Data storytelling"
        ]
    },
    "Data Structures": {
        topics: [
            "Arrays",
            "Linked Lists",
            "Stacks and Queues",
            "Trees",
            "Graphs",
            "Hash Tables",
            "Heaps"
        ]
    },
    Algorithms: {
        topics: [
            "Searching algorithms",
            "Sorting algorithms",
            "Recursion",
            "Two pointers",
            "Sliding window",
            "Dynamic programming",
            "Graph algorithms"
        ]
    },
    Java: {
        topics: [
            "Java fundamentals",
            "OOP",
            "Collections Framework",
            "Exception handling",
            "Streams",
            "Multithreading",
            "Advanced Java"
        ]
    },
    JavaScript: {
        topics: [
            "JavaScript fundamentals",
            "Functions",
            "Arrays and objects",
            "ES6+",
            "Promises and async/await",
            "DOM manipulation",
            "Advanced JavaScript"
        ]
    },
    React: {
        topics: [
            "React fundamentals",
            "Components and props",
            "State management",
            "Hooks",
            "React Router",
            "API integration",
            "Performance optimization"
        ]
    },
    MongoDB: {
        topics: [
            "MongoDB fundamentals",
            "CRUD operations",
            "Query operators",
            "Aggregation",
            "Indexes",
            "Schema design",
            "Performance optimization"
        ]
    },
    DBMS: {
        topics: [
            "Database fundamentals",
            "Normalization",
            "Keys and constraints",
            "Transactions",
            "Indexing",
            "ACID properties",
            "Database optimization"
        ]
    },
    "Operating Systems": {
        topics: [
            "Processes and threads",
            "CPU scheduling",
            "Memory management",
            "Deadlocks",
            "Virtual memory",
            "File systems"
        ]
    },
    "Computer Networks": {
        topics: [
            "OSI model",
            "TCP/IP",
            "HTTP and HTTPS",
            "DNS",
            "IP addressing",
            "Routing",
            "Network security"
        ]
    },
    Git: {
        topics: [
            "Git fundamentals",
            "Branches",
            "Merge and rebase",
            "Conflict resolution",
            "Remote repositories",
            "Advanced Git workflows"
        ]
    }
};
// GET RECOMMENDATIONS FOR A SKILL
const getSkillRecommendations = (skillName) => {
    return recommendationMap[skillName] || {
        topics: [
            `Learn ${skillName} fundamentals`,
            `Practice ${skillName} concepts`,
            `Solve practical ${skillName} problems`,
            `Build projects using ${skillName}`
        ]
    };
};
// ANALYZE WEAK SKILLS
const analyzeWeakSkills = (skillPerformance) => {
    const weakSkills = [];
    const strongSkills = [];
    const moderateSkills = [];
    for (const skill of skillPerformance) {
        const percentage =
            skill.percentage || 0;
        if (percentage < 40) {
            weakSkills.push({
                skill:
                    skill.skill,
                percentage,
                level:
                    "Beginner",
                priority:
                    "High"
            });
        } else if (percentage < 70) {
            moderateSkills.push({
                skill:
                    skill.skill,
                percentage,
                level:
                    "Intermediate",
                priority:
                    "Medium"
            });
        } else {
            strongSkills.push({
                skill:
                    skill.skill,
                percentage,
                level:
                    skill.level,
                priority:
                    "Low"
            });
        }
    }
    // SORT WEAKEST FIRST
    weakSkills.sort(
        (a, b) =>
            a.percentage -
            b.percentage
    );
    moderateSkills.sort(
        (a, b) =>
            a.percentage -
            b.percentage
    );
    // CREATE RECOMMENDATIONS
    const recommendations = [
        ...weakSkills,
        ...moderateSkills
    ].map(skill => {
        const recommendation =
            getSkillRecommendations(
                skill.skill
            );
        return {
            skill:
                skill.skill,
            currentScore:
                skill.percentage,
            currentLevel:
                skill.level,
            priority:
                skill.priority,
            recommendedTopics:
                recommendation.topics
        };
    });
    return {
        weakSkills,
        moderateSkills,
        strongSkills,
        recommendations
    };
};
module.exports = {
    analyzeWeakSkills,
    getSkillRecommendations
};