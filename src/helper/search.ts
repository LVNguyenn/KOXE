
const search = async ({ data, q, fieldname, fieldname2 }:
    { data: any, q?: string, fieldname: string, fieldname2?: string }) => {

    try {
        return data.filter(function (obj: any) {
            let lowerKeyword = q?.toLowerCase();
            let fieldValue = fieldname2 ? obj[fieldname][fieldname2] : obj[fieldname];
            fieldValue = fieldValue ? fieldValue.toLowerCase() : "W";
            return fieldValue.includes(lowerKeyword);
        });
    } catch (error) {
        return null;
    }
}

export default search;
