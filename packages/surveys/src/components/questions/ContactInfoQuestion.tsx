import { BackButton } from "@/components/buttons/BackButton";
import { SubmitButton } from "@/components/buttons/SubmitButton";
import { Headline } from "@/components/general/Headline";
import { Input } from "@/components/general/Input";
import { QuestionMedia } from "@/components/general/QuestionMedia";
import { Subheader } from "@/components/general/Subheader";
import { ScrollableContainer } from "@/components/wrappers/ScrollableContainer";
import { getUpdatedTtc, useTtc } from "@/lib/ttc";
import { useMemo, useRef, useState } from "preact/hooks";
import { getLocalizedValue } from "@formbricks/lib/i18n/utils";
import { TResponseData, TResponseTtc } from "@formbricks/types/responses";
import type { TSurveyContactInfoQuestion } from "@formbricks/types/surveys/types";

interface ContactInfoQuestionProps {
  question: TSurveyContactInfoQuestion;
  value?: string[];
  onChange: (responseData: TResponseData) => void;
  onSubmit: (data: TResponseData, ttc: TResponseTtc) => void;
  onBack: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  autoFocus?: boolean;
  languageCode: string;
  ttc: TResponseTtc;
  setTtc: (ttc: TResponseTtc) => void;
  currentQuestionId: string;
}

export const ContactInfoQuestion = ({
  question,
  value,
  onChange,
  onSubmit,
  onBack,
  isFirstQuestion,
  isLastQuestion,
  languageCode,
  ttc,
  setTtc,
  currentQuestionId,
}: ContactInfoQuestionProps) => {
  const [startTime, setStartTime] = useState(performance.now());
  const isMediaAvailable = question.imageUrl || question.videoUrl;
  const formRef = useRef<HTMLFormElement>(null);
  useTtc(question.id, ttc, setTtc, startTime, setStartTime, question.id === currentQuestionId);

  const safeValue = useMemo(() => {
    return Array.isArray(value) ? value : ["", "", "", "", ""];
  }, [value]);

  const fields = [
    {
      id: "firstName",
      placeholder: "First Name",
      ...question.firstName,
    },
    {
      id: "lastName",
      placeholder: "Last Name",
      ...question.lastName,
    },
    {
      id: "email",
      placeholder: "Email",
      ...question.email,
    },
    {
      id: "phone",
      placeholder: "Phone",
      ...question.phone,
    },
    {
      id: "company",
      placeholder: "Company",
      ...question.company,
    },
  ];

  const handleChange = (fieldId: string, fieldValue: string) => {
    const newValue = fields.map((field) => {
      if (field.id === fieldId) {
        return fieldValue;
      }
      const existingValue = safeValue?.[fields.findIndex((f) => f.id === field.id)] || "";
      return field.show ? existingValue : "";
    });
    onChange({ [question.id]: newValue });
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const updatedTtc = getUpdatedTtc(ttc, question.id, performance.now() - startTime);
    setTtc(updatedTtc);
    const containsAllEmptyStrings = safeValue?.length === 5 && safeValue.every((item) => item.trim() === "");
    if (containsAllEmptyStrings) {
      onSubmit({ [question.id]: [] }, updatedTtc);
    } else {
      onSubmit({ [question.id]: safeValue ?? [] }, updatedTtc);
    }
  };

  return (
    <form key={question.id} onSubmit={handleSubmit} className="fb-w-full" ref={formRef}>
      <ScrollableContainer>
        <div>
          {isMediaAvailable && <QuestionMedia imgUrl={question.imageUrl} videoUrl={question.videoUrl} />}
          <Headline
            headline={getLocalizedValue(question.headline, languageCode)}
            questionId={question.id}
            required={question.required}
          />
          <Subheader
            subheader={question.subheader ? getLocalizedValue(question.subheader, languageCode) : ""}
            questionId={question.id}
          />

          <div className={`fb-flex fb-flex-col fb-space-y-2 fb-mt-4 fb-w-full`}>
            {fields.map((field, index) => {
              const isFieldRequired = () => {
                if (field.required) {
                  return true;
                }

                // if all fields are optional and the question is required, then the fields should be required
                if (
                  fields.filter((field) => field.show).every((field) => !field.required) &&
                  question.required
                ) {
                  return true;
                }

                return false;
              };

              let inputType = "text";
              if (field.id === "email") {
                inputType = "email";
              } else if (field.id === "phone") {
                inputType = "number";
              }

              return (
                field.show && (
                  <Input
                    key={field.id}
                    placeholder={isFieldRequired() ? `${field.placeholder}*` : field.placeholder}
                    required={isFieldRequired()}
                    value={safeValue?.[index] || ""}
                    className="fb-py-3"
                    type={inputType}
                    onChange={(e) => handleChange(field.id, e?.currentTarget?.value ?? "")}
                  />
                )
              );
            })}
          </div>
          <div className="fb-flex fb-w-full fb-justify-between fb-py-4">
            {!isFirstQuestion && (
              <BackButton
                tabIndex={8}
                backButtonLabel={getLocalizedValue(question.backButtonLabel, languageCode)}
                onClick={() => {
                  const updatedttc = getUpdatedTtc(ttc, question.id, performance.now() - startTime);
                  setTtc(updatedttc);
                  onBack();
                }}
              />
            )}
            <div></div>
            <SubmitButton
              tabIndex={7}
              buttonLabel={getLocalizedValue(question.buttonLabel, languageCode)}
              isLastQuestion={isLastQuestion}
              onClick={() => {}}
            />
          </div>
        </div>
      </ScrollableContainer>
    </form>
  );
};