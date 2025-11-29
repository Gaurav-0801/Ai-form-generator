// Bonus: Local Node.js testing script (run with: node test-agent-local.js)

// Define documents inline for Node.js
const DOCUMENTS = [
  "Machine learning is a subset of artificial intelligence that enables systems to learn from data",
  "Deep learning uses neural networks with multiple layers to process complex patterns",
  "Natural language processing helps computers understand and generate human language",
  "Computer vision enables machines to interpret and analyze visual information from images",
  "Reinforcement learning trains agents to make decisions through reward and punishment signals",
  "Data science combines statistics, programming, and domain knowledge to extract insights",
  "Neural networks are inspired by biological neurons and process information in layers",
  "Algorithm optimization improves computational efficiency and reduces execution time",
  "Cloud computing provides on-demand computing resources over the internet",
  "Distributed systems manage multiple machines working together to achieve a common goal",
  "Blockchain technology ensures security through decentralized and immutable records",
  "Quantum computing leverages quantum mechanics principles for exponentially faster processing",
]

// Semantic Search Implementation
class SemanticSearch {
  constructor(documents) {
    this.documents = documents
    this.vocabulary = this.buildVocabulary()
  }

  buildVocabulary() {
    const vocab = new Set()
    this.documents.forEach((doc) => {
      const words = this.tokenize(doc)
      words.forEach((word) => vocab.add(word))
    })
    return Array.from(vocab)
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  }

  vectorize(text) {
    const tokens = this.tokenize(text)
    const vector = new Array(this.vocabulary.length).fill(0)
    tokens.forEach((token) => {
      const idx = this.vocabulary.indexOf(token)
      if (idx !== -1) vector[idx]++
    })
    return vector
  }

  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0
    let mag1 = 0
    let mag2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      mag1 += vec1[i] * vec1[i]
      mag2 += vec2[i] * vec2[i]
    }

    mag1 = Math.sqrt(mag1)
    mag2 = Math.sqrt(mag2)

    if (mag1 === 0 || mag2 === 0) return 0
    return dotProduct / (mag1 * mag2)
  }

  search(query, topK = 3) {
    const queryVector = this.vectorize(query)
    const scores = this.documents.map((doc, idx) => {
      const docVector = this.vectorize(doc)
      const similarity = this.cosineSimilarity(queryVector, docVector)
      return { text: doc, score: Math.max(0, similarity), index: idx }
    })

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item) => ({ text: item.text, score: Number.parseFloat(item.score.toFixed(4)) }))
  }
}

// Keyword Search Implementation
class KeywordSearch {
  constructor(documents) {
    this.documents = documents
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 0)
  }

  search(query, topK = 3) {
    const queryTokens = this.tokenize(query)

    const scores = this.documents.map((doc, idx) => {
      const docTokens = this.tokenize(doc)
      let matchCount = 0

      queryTokens.forEach((token) => {
        if (docTokens.includes(token)) matchCount++
      })

      const normalizedScore = matchCount / Math.max(queryTokens.length, 1)
      return { text: doc, score: normalizedScore, index: idx }
    })

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter((item) => item.score > 0)
      .map((item) => ({ text: item.text, score: Number.parseFloat(item.score.toFixed(4)) }))
  }
}

// AI Planner
class AIPlanner {
  planToolSelection(query, semanticScores, keywordScores) {
    const queryLength = query.split(/\s+/).length
    const semanticBest = semanticScores[0]?.score || 0
    const keywordBest = keywordScores[0]?.score || 0

    let reasoning = ""

    if (queryLength > 5) {
      reasoning += `Query is long (${queryLength} words, >5). Semantic search preferred. `
    }

    if (keywordBest > 0.6) {
      reasoning += `Strong keyword match (score: ${keywordBest.toFixed(2)}). Keyword search is effective. `
    }

    const scoreDiff = Math.abs(semanticBest - keywordBest)

    if (semanticBest > 0.5 && keywordBest < 0.3) {
      reasoning += `Semantic clearly wins (${semanticBest.toFixed(2)} vs ${keywordBest.toFixed(2)}). `
      return { decision: "semantic_search", reasoning }
    }

    if (keywordBest > 0.5 && semanticBest < 0.3) {
      reasoning += `Keyword clearly wins (${keywordBest.toFixed(2)} vs ${semanticBest.toFixed(2)}). `
      return { decision: "keyword_search", reasoning }
    }

    if (scoreDiff < 0.15 && semanticBest > 0.2) {
      reasoning += `Scores are close (diff: ${scoreDiff.toFixed(2)}). Running hybrid search. `
      return { decision: "hybrid", reasoning }
    }

    if (queryLength > 5) {
      return { decision: "semantic_search", reasoning: reasoning + "Defaulting to semantic." }
    }

    reasoning += `Defaulting to hybrid for balanced coverage. `
    return { decision: "hybrid", reasoning }
  }
}

// Main Agent
class ReasoningAgent {
  constructor(documents = DOCUMENTS) {
    this.semanticSearch = new SemanticSearch(documents)
    this.keywordSearch = new KeywordSearch(documents)
    this.planner = new AIPlanner()
  }

  async reason(query) {
    const startTime = performance.now()

    const semanticResults = this.semanticSearch.search(query, 3)
    const keywordResults = this.keywordSearch.search(query, 3)

    const { decision, reasoning } = this.planner.planToolSelection(query, semanticResults, keywordResults)

    let bestMatch,
      usedFallback = false

    if (decision === "semantic_search") {
      bestMatch = semanticResults[0]
    } else if (decision === "keyword_search") {
      bestMatch = keywordResults[0]
    } else {
      const semantic = semanticResults[0]?.score || 0
      const keyword = keywordResults[0]?.score || 0
      bestMatch = semantic > keyword ? semanticResults[0] : keywordResults[0]
    }

    if (!bestMatch || bestMatch.score < 0.75) {
      usedFallback = true
      const allResults = [...semanticResults, ...keywordResults].sort((a, b) => b.score - a.score)
      bestMatch = allResults[0] || { text: "No results found", score: 0 }
    }

    const endTime = performance.now()

    return {
      planner_decision: decision,
      used_fallback_tool: usedFallback,
      best_match: {
        text: bestMatch.text || "No match",
        score: Number.parseFloat((bestMatch.score || 0).toFixed(2)),
        source: "local",
      },
      trace: {
        reasoning,
        semantic_top_k_scores: semanticResults.map((r) => ({ text: r.text.substring(0, 50) + "...", score: r.score })),
        keyword_top_k_scores: keywordResults.map((r) => ({ text: r.text.substring(0, 50) + "...", score: r.score })),
        latency_ms: Math.round(endTime - startTime),
      },
    }
  }
}

// Test execution
async function runTests() {
  const agent = new ReasoningAgent()

  const testQueries = [
    "neural networks and deep learning",
    "machine learning",
    "cloud computing resources",
    "what is quantum computing",
    "blockchain",
  ]

  console.log("=".repeat(80))
  console.log("AI AGENT REASONING TESTS")
  console.log("=".repeat(80))

  for (const query of testQueries) {
    const result = await agent.reason(query)

    console.log(`\nQuery: "${query}"`)
    console.log("-".repeat(80))
    console.log(JSON.stringify(result, null, 2))
  }

  console.log("\n" + "=".repeat(80))
  console.log("TESTS COMPLETE")
  console.log("=".repeat(80))
}

// Run tests
runTests().catch(console.error)
