#!/bin/bash

# Pre-push script for GameHub
# This script runs all necessary checks before pushing code

set -e  # Exit on any error

echo "🚀 GameHub Pre-Push Checks"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    pnpm install --frozen-lockfile
fi

# Run TypeScript type checking
print_status "Running TypeScript type checking..."
if npx tsc --noEmit; then
    print_success "TypeScript type checking passed"
else
    print_error "TypeScript type checking failed"
    exit 1
fi

# Run linting
print_status "Running ESLint..."
if npm run lint; then
    print_success "Linting passed"
else
    print_error "Linting failed"
    exit 1
fi

# Run tests
print_status "Running tests..."
if npm run test:ci; then
    print_success "All tests passed"
else
    print_error "Tests failed"
    exit 1
fi

# Check test coverage (optional)
if [ "$1" = "--coverage" ]; then
    print_status "Running test coverage..."
    if npm run test:coverage; then
        print_success "Test coverage check passed"
    else
        print_error "Test coverage check failed"
        exit 1
    fi
fi

# Check for uncommitted changes
print_status "Checking for uncommitted changes..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Push aborted due to uncommitted changes"
        exit 1
    fi
else
    print_success "No uncommitted changes found"
fi

# Check if we're on a feature branch (optional)
current_branch=$(git branch --show-current)
if [ "$current_branch" = "main" ] || [ "$current_branch" = "master" ]; then
    print_warning "You're on the main branch. Consider using a feature branch for development."
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Push aborted"
        exit 1
    fi
fi

echo ""
print_success "All pre-push checks passed! 🎉"
echo "=========================="
echo "You can now safely push your code."
echo ""
echo "Next steps:"
echo "1. git push origin $current_branch"
echo "2. Create a pull request (if applicable)"
echo "3. Request code review"
echo ""

exit 0 