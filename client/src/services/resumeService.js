import api from "./api";

const uploadResume = async (file, company, role) => {
    const formData = new FormData();

    formData.append("resume", file);
    formData.append("company", company);
    formData.append("role", role);

    const response = await api.post(
        "/resumes/upload",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    );

    return response.data;
};


const analyzeResume = async (resumeId) => {

    const response = await api.post(
        `/resumes/${resumeId}/analyze`
    );

    return response.data;
};


const getSkillGap = async (resumeId) => {

    const response = await api.post(
        `/resumes/${resumeId}/skill-gap`
    );

    return response.data;
};


export default {
    uploadResume,
    analyzeResume,
    getSkillGap
};