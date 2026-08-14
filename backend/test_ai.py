from ai import study_chain


study_material = """
Faisal Mosque is one of the most famous landmarks in Pakistan.
It is located near the Margalla Hills in Islamabad.
The mosque was designed by Turkish architect Vedat Dalokay.
It is known for its unique modern Islamic architecture.
The mosque is an important religious and tourist attraction.
"""


result = study_chain.invoke({
    "content": study_material
})


print("\n===== NOTES =====\n")

print("SUMMARY:")
print(result["notes"].summary)

print("\nKEY CONCEPTS:")
for concept in result["notes"].key_concepts:
    print(f"- {concept}")

print("\nIMPORTANT POINTS:")
for point in result["notes"].important_points:
    print(f"- {point}")


print("\n===== QUIZ =====\n")

for index, question in enumerate(result["quiz"].questions, start=1):
    print(f"{index}. {question.question}")

    for option in question.options:
        print(f"   - {option}")

    print(f"Correct Answer: {question.correct_answer}")
    print(f"Explanation: {question.explanation}")
    print()